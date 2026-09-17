// Model capacities and measured socket centres on local imagegen illustrations.
// These named models never change the meaning of the older generic stagebox types.
(function(global){
  'use strict';
  const models = [
  {
    "type": "stagebox-behringer-s16",
    "brand": "Behringer",
    "name": "S16",
    "inputs": 16,
    "outputs": 8,
    "comboJacks": false,
    "protocol": "AES50",
    "width": 482.0,
    "depth": 225.0,
    "file": "s16-front-v1.png",
    "frame": [
      2048,
      683
    ],
    "viewBox": [
      0,
      141,
      2048,
      395
    ],
    "diameter": 88,
    "ports": {
      "inputs": [
        [
          171,
          271
        ],
        [
          282,
          271
        ],
        [
          393,
          271
        ],
        [
          504,
          271
        ],
        [
          615,
          271
        ],
        [
          726,
          271
        ],
        [
          837,
          271
        ],
        [
          948,
          271
        ],
        [
          171,
          437
        ],
        [
          282,
          437
        ],
        [
          393,
          437
        ],
        [
          504,
          437
        ],
        [
          615,
          437
        ],
        [
          726,
          437
        ],
        [
          837,
          437
        ],
        [
          948,
          437
        ]
      ],
      "outputs": [
        [
          1107,
          437
        ],
        [
          1218,
          437
        ],
        [
          1329,
          437
        ],
        [
          1440,
          437
        ],
        [
          1551,
          437
        ],
        [
          1662,
          437
        ],
        [
          1773,
          437
        ],
        [
          1884,
          437
        ]
      ]
    }
  },
  {
    "type": "stagebox-behringer-s32",
    "brand": "Behringer",
    "name": "S32",
    "inputs": 32,
    "outputs": 16,
    "comboJacks": false,
    "protocol": "AES50",
    "width": 483.0,
    "depth": 242.0,
    "file": "s32-front-v1.png",
    "frame": [
      2048,
      732
    ],
    "viewBox": [
      0,
      113,
      2048,
      558
    ],
    "diameter": 90,
    "ports": {
      "inputs": [
        [
          164.0,
          232
        ],
        [
          273.6,
          232
        ],
        [
          383.2,
          232
        ],
        [
          492.8,
          232
        ],
        [
          602.4,
          232
        ],
        [
          712.0,
          232
        ],
        [
          821.6,
          232
        ],
        [
          931.2,
          232
        ],
        [
          1040.8,
          232
        ],
        [
          1150.4,
          232
        ],
        [
          1260.0,
          232
        ],
        [
          1369.6,
          232
        ],
        [
          1479.2,
          232
        ],
        [
          1588.8,
          232
        ],
        [
          1698.4,
          232
        ],
        [
          1808.0,
          232
        ],
        [
          164.0,
          382
        ],
        [
          273.6,
          382
        ],
        [
          383.2,
          382
        ],
        [
          492.8,
          382
        ],
        [
          602.4,
          382
        ],
        [
          712.0,
          382
        ],
        [
          821.6,
          382
        ],
        [
          931.2,
          382
        ],
        [
          1040.8,
          382
        ],
        [
          1150.4,
          382
        ],
        [
          1260.0,
          382
        ],
        [
          1369.6,
          382
        ],
        [
          1479.2,
          382
        ],
        [
          1588.8,
          382
        ],
        [
          1698.4,
          382
        ],
        [
          1808.0,
          382
        ]
      ],
      "outputs": [
        [
          164.0,
          579
        ],
        [
          273.6,
          579
        ],
        [
          383.2,
          579
        ],
        [
          492.8,
          579
        ],
        [
          602.4,
          579
        ],
        [
          712.0,
          579
        ],
        [
          821.6,
          579
        ],
        [
          931.2,
          579
        ],
        [
          1040.8,
          579
        ],
        [
          1150.4,
          579
        ],
        [
          1260.0,
          579
        ],
        [
          1369.6,
          579
        ],
        [
          1479.2,
          579
        ],
        [
          1588.8,
          579
        ],
        [
          1698.4,
          579
        ],
        [
          1808.0,
          579
        ]
      ]
    }
  },
  {
    "type": "stagebox-behringer-sd8",
    "brand": "Behringer",
    "name": "SD8",
    "inputs": 8,
    "outputs": 8,
    "comboJacks": true,
    "protocol": "AES50",
    "width": 333.0,
    "depth": 149.0,
    "file": "sd8-front-v1.png",
    "frame": [
      2048,
      685
    ],
    "viewBox": [
      8,
      46,
      2030,
      592
    ],
    "diameter": 132,
    "ports": {
      "inputs": [
        [
          532,
          296
        ],
        [
          704,
          296
        ],
        [
          876,
          296
        ],
        [
          1048,
          296
        ],
        [
          1220,
          296
        ],
        [
          1392,
          296
        ],
        [
          1564,
          296
        ],
        [
          1736,
          296
        ]
      ],
      "outputs": [
        [
          532,
          483
        ],
        [
          704,
          483
        ],
        [
          876,
          483
        ],
        [
          1048,
          483
        ],
        [
          1220,
          483
        ],
        [
          1392,
          483
        ],
        [
          1564,
          483
        ],
        [
          1736,
          483
        ]
      ]
    }
  },
  {
    "type": "stagebox-behringer-sd16",
    "brand": "Behringer",
    "name": "SD16",
    "inputs": 16,
    "outputs": 8,
    "comboJacks": true,
    "protocol": "AES50",
    "width": 333,
    "depth": 149,
    "file": "sd16-front-v1.png",
    "frame": [
      1942,
      809
    ],
    "viewBox": [
      0,
      0,
      1942,
      809
    ],
    "diameter": 130,
    "ports": {
      "inputs": [
        [
          501.0,
          270
        ],
        [
          663.8,
          270
        ],
        [
          826.6,
          270
        ],
        [
          989.4,
          270
        ],
        [
          1152.2,
          270
        ],
        [
          1315.0,
          270
        ],
        [
          1477.8,
          270
        ],
        [
          1640.6,
          270
        ],
        [
          501.0,
          454
        ],
        [
          663.8,
          454
        ],
        [
          826.6,
          454
        ],
        [
          989.4,
          454
        ],
        [
          1152.2,
          454
        ],
        [
          1315.0,
          454
        ],
        [
          1477.8,
          454
        ],
        [
          1640.6,
          454
        ]
      ],
      "outputs": [
        [
          501.0,
          638
        ],
        [
          663.8,
          638
        ],
        [
          826.6,
          638
        ],
        [
          989.4,
          638
        ],
        [
          1152.2,
          638
        ],
        [
          1315.0,
          638
        ],
        [
          1477.8,
          638
        ],
        [
          1640.6,
          638
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-ar84",
    "brand": "Allen & Heath",
    "name": "AR84",
    "inputs": 8,
    "outputs": 4,
    "comboJacks": false,
    "protocol": "dSNAKE",
    "width": 482.59999999999997,
    "depth": 217.9,
    "file": "ar84-front-v1.png",
    "frame": [
      2048,
      685
    ],
    "viewBox": [
      15,
      238,
      2020,
      202
    ],
    "diameter": 102,
    "ports": {
      "inputs": [
        [
          235.0,
          348
        ],
        [
          361.6,
          348
        ],
        [
          488.2,
          348
        ],
        [
          614.8,
          348
        ],
        [
          741.4,
          348
        ],
        [
          868.0,
          348
        ],
        [
          994.6,
          348
        ],
        [
          1121.2,
          348
        ]
      ],
      "outputs": [
        [
          1314,
          348
        ],
        [
          1440,
          348
        ],
        [
          1566,
          348
        ],
        [
          1692,
          348
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-ar2412",
    "brand": "Allen & Heath",
    "name": "AR2412",
    "inputs": 24,
    "outputs": 12,
    "comboJacks": false,
    "protocol": "dSNAKE",
    "width": 482.6,
    "depth": 219.4,
    "file": "ar2412-front-v1.png",
    "frame": [
      2048,
      692
    ],
    "viewBox": [
      30,
      68,
      1990,
      557
    ],
    "diameter": 100,
    "ports": {
      "inputs": [
        [
          238.0,
          188
        ],
        [
          360.5,
          188
        ],
        [
          483.0,
          188
        ],
        [
          605.5,
          188
        ],
        [
          728.0,
          188
        ],
        [
          850.5,
          188
        ],
        [
          973.0,
          188
        ],
        [
          1095.5,
          188
        ],
        [
          238.0,
          349
        ],
        [
          360.5,
          349
        ],
        [
          483.0,
          349
        ],
        [
          605.5,
          349
        ],
        [
          728.0,
          349
        ],
        [
          850.5,
          349
        ],
        [
          973.0,
          349
        ],
        [
          1095.5,
          349
        ],
        [
          238.0,
          513
        ],
        [
          360.5,
          513
        ],
        [
          483.0,
          513
        ],
        [
          605.5,
          513
        ],
        [
          728.0,
          513
        ],
        [
          850.5,
          513
        ],
        [
          973.0,
          513
        ],
        [
          1095.5,
          513
        ]
      ],
      "outputs": [
        [
          1275,
          188
        ],
        [
          1397,
          188
        ],
        [
          1519,
          188
        ],
        [
          1641,
          188
        ],
        [
          1275,
          349
        ],
        [
          1397,
          349
        ],
        [
          1519,
          349
        ],
        [
          1641,
          349
        ],
        [
          1275,
          513
        ],
        [
          1397,
          513
        ],
        [
          1519,
          513
        ],
        [
          1641,
          513
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-ab168",
    "brand": "Allen & Heath",
    "name": "AB168",
    "inputs": 16,
    "outputs": 8,
    "comboJacks": false,
    "protocol": "dSNAKE",
    "width": 411.45,
    "depth": 189,
    "file": "ab168-front-v1.png",
    "frame": [
      1919,
      820
    ],
    "viewBox": [
      78,
      34,
      1834,
      773
    ],
    "diameter": 102,
    "ports": {
      "inputs": [
        [
          277.0,
          349
        ],
        [
          396.7,
          349
        ],
        [
          516.4,
          349
        ],
        [
          636.1,
          349
        ],
        [
          755.8,
          349
        ],
        [
          875.5,
          349
        ],
        [
          995.2,
          349
        ],
        [
          1114.9,
          349
        ],
        [
          277.0,
          522
        ],
        [
          396.7,
          522
        ],
        [
          516.4,
          522
        ],
        [
          636.1,
          522
        ],
        [
          755.8,
          522
        ],
        [
          875.5,
          522
        ],
        [
          995.2,
          522
        ],
        [
          1114.9,
          522
        ]
      ],
      "outputs": [
        [
          1273.0,
          349
        ],
        [
          1392.5,
          349
        ],
        [
          1512.0,
          349
        ],
        [
          1631.5,
          349
        ],
        [
          1273.0,
          522
        ],
        [
          1392.5,
          522
        ],
        [
          1512.0,
          522
        ],
        [
          1631.5,
          522
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-dx168",
    "brand": "Allen & Heath",
    "name": "DX168",
    "inputs": 16,
    "outputs": 8,
    "comboJacks": false,
    "protocol": "DX",
    "width": 410.0,
    "depth": 190.0,
    "file": "dx168-front-v1.png",
    "frame": [
      1536,
      1024
    ],
    "viewBox": [
      44,
      196,
      1470,
      649
    ],
    "diameter": 82,
    "ports": {
      "inputs": [
        [
          195.0,
          446
        ],
        [
          292.4,
          446
        ],
        [
          389.8,
          446
        ],
        [
          487.2,
          446
        ],
        [
          584.6,
          446
        ],
        [
          682.0,
          446
        ],
        [
          779.4,
          446
        ],
        [
          876.8,
          446
        ],
        [
          195.0,
          599
        ],
        [
          292.4,
          599
        ],
        [
          389.8,
          599
        ],
        [
          487.2,
          599
        ],
        [
          584.6,
          599
        ],
        [
          682.0,
          599
        ],
        [
          779.4,
          599
        ],
        [
          876.8,
          599
        ]
      ],
      "outputs": [
        [
          1015.0,
          446
        ],
        [
          1112.5,
          446
        ],
        [
          1210.0,
          446
        ],
        [
          1307.5,
          446
        ],
        [
          1015.0,
          599
        ],
        [
          1112.5,
          599
        ],
        [
          1210.0,
          599
        ],
        [
          1307.5,
          599
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-dt168",
    "brand": "Allen & Heath",
    "name": "DT168",
    "inputs": 16,
    "outputs": 8,
    "comboJacks": false,
    "protocol": "Dante",
    "width": 398.6,
    "depth": 189,
    "file": "dt168-front-v1.png",
    "frame": [
      1774,
      887
    ],
    "viewBox": [
      43,
      90,
      1727,
      754
    ],
    "diameter": 100,
    "ports": {
      "inputs": [
        [
          226.0,
          390
        ],
        [
          341.3,
          390
        ],
        [
          456.6,
          390
        ],
        [
          571.9,
          390
        ],
        [
          687.2,
          390
        ],
        [
          802.5,
          390
        ],
        [
          917.8,
          390
        ],
        [
          1033.1,
          390
        ],
        [
          226.0,
          561
        ],
        [
          341.3,
          561
        ],
        [
          456.6,
          561
        ],
        [
          571.9,
          561
        ],
        [
          687.2,
          561
        ],
        [
          802.5,
          561
        ],
        [
          917.8,
          561
        ],
        [
          1033.1,
          561
        ]
      ],
      "outputs": [
        [
          1191,
          390
        ],
        [
          1306,
          390
        ],
        [
          1421,
          390
        ],
        [
          1536,
          390
        ],
        [
          1191,
          561
        ],
        [
          1306,
          561
        ],
        [
          1421,
          561
        ],
        [
          1536,
          561
        ]
      ]
    }
  },
  {
    "type": "stagebox-ah-gx4816",
    "brand": "Allen & Heath",
    "name": "GX4816",
    "inputs": 48,
    "outputs": 16,
    "comboJacks": false,
    "protocol": "gigaACE",
    "width": 481.59999999999997,
    "depth": 255.0,
    "file": "gx4816-front-v1.png",
    "frame": [
      1825,
      862
    ],
    "viewBox": [
      24,
      28,
      1784,
      813
    ],
    "diameter": 76,
    "ports": {
      "inputs": [
        [
          240.0,
          150
        ],
        [
          327.3,
          150
        ],
        [
          414.6,
          150
        ],
        [
          501.9,
          150
        ],
        [
          589.2,
          150
        ],
        [
          676.5,
          150
        ],
        [
          763.8,
          150
        ],
        [
          851.1,
          150
        ],
        [
          938.4,
          150
        ],
        [
          1025.7,
          150
        ],
        [
          1113.0,
          150
        ],
        [
          1200.3,
          150
        ],
        [
          240.0,
          286
        ],
        [
          327.3,
          286
        ],
        [
          414.6,
          286
        ],
        [
          501.9,
          286
        ],
        [
          589.2,
          286
        ],
        [
          676.5,
          286
        ],
        [
          763.8,
          286
        ],
        [
          851.1,
          286
        ],
        [
          938.4,
          286
        ],
        [
          1025.7,
          286
        ],
        [
          1113.0,
          286
        ],
        [
          1200.3,
          286
        ],
        [
          240.0,
          423
        ],
        [
          327.3,
          423
        ],
        [
          414.6,
          423
        ],
        [
          501.9,
          423
        ],
        [
          589.2,
          423
        ],
        [
          676.5,
          423
        ],
        [
          763.8,
          423
        ],
        [
          851.1,
          423
        ],
        [
          938.4,
          423
        ],
        [
          1025.7,
          423
        ],
        [
          1113.0,
          423
        ],
        [
          1200.3,
          423
        ],
        [
          240.0,
          560
        ],
        [
          327.3,
          560
        ],
        [
          414.6,
          560
        ],
        [
          501.9,
          560
        ],
        [
          589.2,
          560
        ],
        [
          676.5,
          560
        ],
        [
          763.8,
          560
        ],
        [
          851.1,
          560
        ],
        [
          938.4,
          560
        ],
        [
          1025.7,
          560
        ],
        [
          1113.0,
          560
        ],
        [
          1200.3,
          560
        ]
      ],
      "outputs": [
        [
          1322,
          150
        ],
        [
          1408,
          150
        ],
        [
          1494,
          150
        ],
        [
          1580,
          150
        ],
        [
          1322,
          286
        ],
        [
          1408,
          286
        ],
        [
          1494,
          286
        ],
        [
          1580,
          286
        ],
        [
          1322,
          423
        ],
        [
          1408,
          423
        ],
        [
          1494,
          423
        ],
        [
          1580,
          423
        ],
        [
          1322,
          560
        ],
        [
          1408,
          560
        ],
        [
          1494,
          560
        ],
        [
          1580,
          560
        ]
      ]
    }
  }
];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byType=new Map(models.map(model=>[model.type,model]));
  const get=type=>byType.get(type)||null;
  const capacities=Object.fromEntries(models.map(({type,inputs,outputs,comboJacks})=>[type,{inputs,outputs,comboJacks}]));
  function picture(type,className='sp-stagebox-picture'){
    const m=get(type);if(!m)return '';
    return '<svg class="'+esc(className)+'" viewBox="'+m.viewBox.join(' ')+'" aria-hidden="true" data-stagebox-image="'+m.type+'"><image href="stageplot-assets/stageboxes/'+m.file+'" width="'+m.frame[0]+'" height="'+m.frame[1]+'" preserveAspectRatio="none"/></svg>';
  }
  function artwork(type){
    const m=get(type);if(!m)return '';
    return '<g data-equipment="'+m.type+'" data-generated-stagebox="true"><rect width="'+m.width+'" height="'+m.depth+'" fill="none" stroke="none" pointer-events="none" data-metric-frame="true"/><svg width="'+m.width+'" height="'+m.depth+'" viewBox="'+m.viewBox.join(' ')+'" preserveAspectRatio="xMidYMid meet"><image href="stageplot-assets/stageboxes/'+m.file+'" width="'+m.frame[0]+'" height="'+m.frame[1]+'" preserveAspectRatio="none" data-rendered-stagebox-asset="'+m.type+'"/></svg></g>';
  }
  function surface(type,renderPort,directions=['inputs','outputs']){
    const m=get(type);if(!m)return '';
    const [x,y,w,h]=m.viewBox,percent=n=>Number(n.toFixed(4));
    const sockets=directions.flatMap(direction=>m.ports[direction].map(([px,py],index)=>'<span class="sp-stagebox-hotspot" data-socket-direction="'+direction+'" style="left:'+percent((px-x)/w*100)+'%;top:'+percent((py-y)/h*100)+'%;width:'+percent(m.diameter/w*100)+'%;height:'+percent(m.diameter/h*100)+'%">'+renderPort(direction,index+1)+'</span>')).join('');
    // Min width preserves a 44px target even on the densest 16-column rack.
    const minWidth=Math.ceil(w/m.diameter*44);
    return '<div class="sp-stagebox-device-scroll" tabindex="0" role="region" aria-label="'+esc(m.brand+' '+m.name+' · Buchsenansicht')+'"><div class="sp-stagebox-device" data-stagebox-model="'+m.type+'" style="aspect-ratio:'+w+'/'+h+';min-width:'+minWidth+'px">'+picture(type)+sockets+'</div></div>';
  }
  const api=Object.freeze({models,get,capacities,picture,artwork,surface});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.StageplotStageboxes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
