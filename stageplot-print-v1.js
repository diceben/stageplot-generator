/* Physical A4 pages shared by the preview and browser print output. */
const StageplotPrint = (() => {
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

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
    if (report.summary.length) {
      const summary = element('div', 'sp-report-summary');
      report.summary.forEach(line => summary.append(element('p', '', line)));
      layout.append(summary);
    }
    plan.append(layout);

    let content = null;
    const fits = () => content.scrollHeight <= content.clientHeight + 1;
    function newContent() { content = page('TECHNIK & KANÄLE'); }
    function section(title, continued = false) {
      const node = element('section', 'sp-report-section');
      node.append(element('h3', '', title + (continued ? ' · Fortsetzung' : '')));
      content.append(node);
      return node;
    }
    for (const source of report.sections) {
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
  return { render, fit };
})();
