#!/bin/bash
# helper: run ui-map.js against Flow and dump the node inventory
# usage: ./flowmap.sh <label>
D=10.66.66.2:41273
LABEL=${1:?label required}
docker compose exec -T -e ANDROID_UDID=$D -e APP_PACKAGE=com.frontrow.flow \
  -e FORCE_APP_LAUNCH=false -e MAP_NAME=$LABEL appium \
  npx wdio run ./wdio.conf.js --spec tests/ui-map.js >/dev/null 2>&1
docker compose exec -T appium node -e '
const m=require("/tmp/uimap-'"$LABEL"'.json");
console.log("ACTIVITY:", m.activity||m.currentActivity||"?");
console.log("CONTEXT:", m.context||"?");
const ns=m.nodes||m.elements||[];
console.log("NODES:", ns.length);
for(const n of ns){
  const id=(n.id||n.resourceId||"").replace(/^.*\//,"");
  const t=(n.label||n.text||"").slice(0,40);
  const cl=(n.class||n.className||"").replace(/^android\.widget\./,"").replace(/^android\.view\./,"");
  if(!id && !t) continue;
  console.log([id||"-", JSON.stringify(t), cl, n.clickable?"C":"-", (n.tapX!=null?n.tapX+","+n.tapY:"")].join(" | "));
}
'
