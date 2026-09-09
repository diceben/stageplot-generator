/* Physical A4 pages shared by the preview, PNG and browser print output. */
const StageplotPrint = (() => {
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  function arrangePlan(layout, figure, sources) {
    const box = figure.firstElementChild.viewBox.baseVal;
    const eligible = sources.filter(source => {
      const probe = element('div'); probe.innerHTML = source.html;
      return !probe.querySelector('table') || probe.querySelectorAll('thead th').length <= 2;
    });
    if (!eligible.length) { layout.dataset.layout = 'none'; return new Set(); }
    const height = layout.clientHeight, gap = 12;
    const used = rail => [...rail.children].reduce((sum, node) => sum + node.offsetHeight + gap, -gap);
    function compose(mode) {
      layout.replaceChildren(); layout.dataset.layout = mode;
      layout.style.setProperty('--sp-plan-band', Math.round(height * .35) + 'px');
      const rails = Array.from({length:mode === 'both' ? 2 : mode === 'bottom' ? 3 : 1}, () => element('aside', 'sp-report-aside'));
      if (mode === 'both') layout.append(rails[0], figure, rails[1]);
      else if (mode === 'bottom') {
        const band = element('div', 'sp-report-bottom'); band.append(...rails); layout.append(figure, band);
      } else layout.append(figure, rails[0]);
      const placed = new Set();
      const blocks = eligible.map((source,index) => {
        const block = element('section', 'sp-report-section sp-report-plan-info');
        block.dataset.infoOrder = index;
        block.append(element('h3', '', source.title));
        const body = element('div'); body.innerHTML = source.html; block.append(body);
        rails[0].append(block); const height = block.offsetHeight; block.remove();
        return {source,block,height};
      });
      // Tall blocks first avoids leaving a useful second column half empty.
      if (rails.length > 1) blocks.sort((a,b) => b.height - a.height);
      for (const {source,block} of blocks) {
        for (const rail of [...rails].sort((a,b) => used(a) - used(b))) {
          rail.append(block);
          if (rail.scrollHeight <= rail.clientHeight + 1) { placed.add(source); break; }
          block.remove();
        }
      }
      for (const rail of rails) rail.append(...[...rail.children].sort((a,b) => Number(a.dataset.infoOrder) - Number(b.dataset.infoOrder)));
      if (mode === 'bottom') layout.style.setProperty('--sp-plan-band', Math.max(0, ...rails.map(used)) + 'px');
      figure.firstElementChild.setAttribute('preserveAspectRatio', mode === 'right' ? 'xMinYMid meet' : 'xMidYMid meet');
      return {mode, placed, scale:Math.min(figure.clientWidth / box.width, figure.clientHeight / box.height)};
    }
    // Use spare space without making the actual stage noticeably smaller.
    const candidates = ['right', 'bottom', 'both'].map(compose).filter(candidate => candidate.placed.size);
    if (!candidates.length) { layout.replaceChildren(figure); layout.dataset.layout = 'none'; return new Set(); }
    const bestScale = Math.max(...candidates.map(candidate => candidate.scale));
    const best = candidates.filter(candidate => candidate.scale >= bestScale * .94)
      .sort((a,b) => b.placed.size - a.placed.size || ['right','bottom','both'].indexOf(a.mode) - ['right','bottom','both'].indexOf(b.mode))[0];
    return compose(best.mode).placed;
  }

  function render(host, report) {
    host.replaceChildren();
    const pages = [];
    function page(label) {
      const sheet = element('div', 'sp-report-sheet');
      const paper = element('article', 'sp-report-page');
      const header = element('header', 'sp-report-header');
      const heading = element('div');
      heading.append(element('span', 'sp-report-kicker', label), element('h2', '', report.title));
      header.append(heading, element('p', 'sp-report-subtitle', report.subtitle));
      const content = element('div', 'sp-report-content');
      const footer = element('footer', 'sp-report-footer');
      footer.append(element('span', '', report.id ? 'Projekt-ID · ' + report.id : 'Stageplotter'), element('span', 'sp-report-page-number'));
      paper.append(header, content, footer);
      sheet.append(paper);
      host.append(sheet);
      pages.push(paper);
      return content;
    }

    const plan = page('BÜHNENPLAN');
    const layout = element('div', 'sp-report-plan');
    const figure = element('div', 'sp-report-figure');
    const svg = report.svg.cloneNode(true);
    // Keep local clip paths, hatches and gradients independent of the source SVG.
    const ids = new Map([...svg.querySelectorAll('[id]')].map(node => [node.id, node.id + '-report']));
    for (const node of [svg, ...svg.querySelectorAll('*')]) {
      if (ids.has(node.id)) node.id = ids.get(node.id);
      for (const attr of [...node.attributes]) {
        let value = attr.value.replace(/url\(#([^)]*)\)/g, (match, id) => ids.has(id) ? 'url(#' + ids.get(id) + ')' : match);
        if (attr.name === 'href' && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
        if (value !== attr.value) node.setAttribute(attr.name, value);
      }
    }
    figure.append(svg);
    layout.append(figure);
    plan.append(layout);
    const sources = [...report.sections];
    if (report.summary.length) {
      const summary = element('div');
      report.summary.forEach(line => summary.append(element('p', '', line)));
      sources.unshift({title:'Technische Anforderungen', html:summary.innerHTML});
    }
    const onPlan = arrangePlan(layout, figure, sources);

    let content = null;
    const fits = () => content.scrollHeight <= content.clientHeight + 1;
    function newContent() { content = page('TECHNIK & KANÄLE'); }
    function section(title, continued = false) {
      const node = element('section', 'sp-report-section');
      node.append(element('h3', '', title + (continued ? ' · Fortsetzung' : '')));
      content.append(node);
      return node;
    }
    for (const source of sources) {
      if (onPlan.has(source)) continue;
      const template = element('div');
      template.innerHTML = source.html;
      if (!template.textContent.trim()) continue;
      if (!content) newContent();
      let block = section(source.title);
      const table = template.querySelector('table');
      if (table) {
        // Keep a short table together when it would otherwise leave a few rows alone.
        const probe = table.cloneNode(true);
        block.append(probe);
        const moveTogether = !fits() && block.offsetHeight < content.clientHeight * .65 && content.children.length > 1;
        probe.remove();
        if (moveTogether) { block.remove(); newContent(); block = section(source.title); }
        function tableShell() {
          const copy = table.cloneNode(true);
          copy.querySelector('tbody').replaceChildren();
          block.append(copy);
          return copy.querySelector('tbody');
        }
        let body = tableShell();
        for (const row of [...table.querySelectorAll('tbody > tr')]) {
          body.append(row);
          if (!fits()) {
            row.remove();
            const continued = body.children.length > 0;
            if (!continued) block.remove();
            newContent();
            block = section(source.title, continued);
            body = tableShell();
            body.append(row);
          }
        }
      } else {
        for (const child of [...template.children]) {
          block.append(child);
          if (fits()) continue;
          child.remove();
          const continued = block.children.length > 1;
          if (!continued) block.remove();
          newContent();
          block = section(source.title, continued);
          block.append(child);
          // A long unbroken note is divided at word boundaries, never clipped.
          if (!fits() && child.tagName === 'P') {
            let remaining = child.textContent;
            child.remove();
            while (remaining) {
              const part = element('p', '', remaining);
              block.append(part);
              if (fits()) break;
              let low = 1, high = remaining.length;
              while (low < high) {
                const middle = Math.ceil((low + high) / 2);
                part.textContent = remaining.slice(0, middle);
                if (fits()) low = middle; else high = middle - 1;
              }
              const space = remaining.lastIndexOf(' ', low);
              const cut = space > low / 2 ? space : low;
              part.textContent = remaining.slice(0, cut);
              remaining = remaining.slice(cut).trimStart();
              newContent();
              block = section(source.title, true);
            }
          }
        }
      }
    }
    // An oversized first note can move to its own page before being split.
    for (let i = pages.length - 1; i > 0; i--) {
      if (!pages[i].querySelector('.sp-report-content').textContent.trim()) {
        pages[i].parentElement.remove();
        pages.splice(i, 1);
      }
    }
    pages.forEach((paper, index) => {
      paper.setAttribute('aria-label', 'Seite ' + (index + 1) + ' von ' + pages.length);
      paper.querySelector('.sp-report-page-number').textContent = (index + 1) + ' / ' + pages.length;
    });
    fit(host);
    return pages.length;
  }

  function fit(host) {
    const width = host.clientWidth;
    if (!width) return;
    for (const sheet of host.children) {
      const paper = sheet.firstElementChild;
      const scale = host.dataset.zoom === 'actual' ? 1 : Math.min(1, width / paper.offsetWidth);
      sheet.style.width = paper.offsetWidth * scale + 'px';
      sheet.style.height = paper.offsetHeight * scale + 'px';
      paper.style.transform = 'scale(' + scale + ')';
    }
  }

  async function pageSvg(paper, serializeSvg) {
    // Freeze the actual page layout before awaiting local image assets. No
    // second layout engine: text, tables and the plan retain their PDF positions.
    const copy = paper.cloneNode(true);
    const properties = ('display box-sizing position width height min-width min-height max-width max-height margin padding border border-top border-right border-bottom border-left border-radius background-color color opacity font-family font-size font-style font-weight font-variant line-height letter-spacing word-spacing white-space overflow-wrap word-break text-align text-indent text-decoration text-transform vertical-align table-layout border-collapse border-spacing flex flex-direction flex-wrap align-items align-self justify-content gap row-gap column-gap grid-template-columns grid-template-rows grid-column grid-row').split(' ');
    const original = [paper, ...paper.querySelectorAll('*')], cloned = [copy, ...copy.querySelectorAll('*')];
    original.forEach((node, index) => {
      if (node.namespaceURI === 'http://www.w3.org/2000/svg') return;
      const style = getComputedStyle(node), target = cloned[index];
      target.removeAttribute('id');
      target.style.cssText = properties.map(property => property + ':' + style.getPropertyValue(property)).join(';');
    });
    const style = getComputedStyle(paper), width = parseFloat(style.width), height = parseFloat(style.height);
    copy.style.transform = 'none'; copy.style.boxShadow = 'none'; copy.style.margin = '0';
    const targets = [...copy.querySelectorAll('svg')];
    const sources = [...paper.querySelectorAll('svg')];
    const sizes = sources.map(svg => { const style = getComputedStyle(svg); return {width:style.width, height:style.height}; });
    const plans = sources.map(svg => serializeSvg(svg));
    const markup = await Promise.all(plans);
    markup.forEach((text, index) => {
      const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
      Object.assign(svg.style, sizes[index], {display:'block', maxWidth:'none', maxHeight:'none'});
      targets[index].replaceWith(svg);
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><foreignObject width="100%" height="100%">' + new XMLSerializer().serializeToString(copy) + '</foreignObject></svg>';
  }
  return { render, fit, pageSvg };
})();
