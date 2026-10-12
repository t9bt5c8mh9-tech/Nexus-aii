import { writePsd } from 'ag-psd';
import './style.css';
const app=document.querySelector('#app');
app.innerHTML=`<header><b>✦ NEXUS Studio AI</b><span>Image repair · Editable layers · PSD</span></header><main><aside><h3>Tools</h3><label class="upload">Upload image<input type="file" id="upload" accept="image/png,image/jpeg,image/webp" hidden></label><label>Tool<select id="tool"><option value="clone">Pattern repair brush</option><option value="restore">Smart pattern restoration (select rectangle)</option><option value="text">Position replacement text</option></select></label><label>Brush radius <input id="brush" type="range" min="2" max="100" value="18"></label><p class="note">For pattern repair: hold <b>Alt</b> (Option on Mac) and click a clean matching area to sample it. Then brush over the old lettering. Use short strokes and resample often.</p><button id="restoreBtn">Restore selected area</button><button id="undo">Undo repair stroke</button><button id="clear">Clear repairs</button><hr><h3>Replacement text</h3><label>Text<input id="words" value="JAMES"></label><label>Color<input type="color" id="color" value="#111111"></label><label>Size<input type="range" id="size" min="12" max="150" value="48"></label><button id="toggle">Toggle replacement text</button><hr><button id="export">Export layered PSD</button><button id="png">Export PNG preview</button><p id="status" class="note">Upload an image to start.</p></aside><section><div class="toolbar">Canvas <span id="dimensions">No image loaded</span></div><div class="stage"><canvas id="canvas" width="960" height="600"></canvas></div></section><aside><h3>Layers</h3><div class="layer">T · Editable replacement text</div><div class="layer">▧ Repair layer (non-destructive)</div><div class="layer">▣ Original image (untouched)</div><p class="note">This version includes a working manual pattern clone brush, reversible repairs, and PSD export. Automated AI restoration is not yet connected. No restoration can recover fully hidden original pixels with certainty.</p></aside></main>`;
const $=s=>document.querySelector(s), canvas=$('#canvas'),ctx=canvas.getContext('2d');
let selection=null, dragStart=null, img=null, visible=true, pos={x:480,y:300}, repair=document.createElement('canvas'),rc=repair.getContext('2d'),sample=null, stroke=null,painting=false,history=[];
const status=s=>$('#status').textContent=s;
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);if(img){ctx.drawImage(img,0,0);ctx.drawImage(repair,0,0)}else{ctx.fillStyle='#1b2537';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#a7b7d1';ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText('Upload an image to begin',canvas.width/2,canvas.height/2)}if(selection){ctx.save();ctx.strokeStyle="#facc15";ctx.lineWidth=Math.max(2,canvas.width/700);ctx.setLineDash([8,5]);ctx.strokeRect(selection.x,selection.y,selection.w,selection.h);ctx.restore()}if(visible){ctx.fillStyle=$('#color').value;ctx.font=`bold ${$('#size').value}px Arial`;ctx.textAlign='center';ctx.fillText($('#words').value,pos.x,pos.y);ctx.textAlign='left'}}
function xy(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
$('#upload').onchange=e=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file),loaded=new Image();loaded.onload=()=>{img=loaded;canvas.width=loaded.naturalWidth;canvas.height=loaded.naturalHeight;repair.width=canvas.width;repair.height=canvas.height;rc=repair.getContext('2d');history=[];sample=null;selection=null;pos={x:canvas.width/2,y:canvas.height/2};$('#dimensions').textContent=`${canvas.width} × ${canvas.height}`;status('Image loaded. Alt-click a clean area to sample.');draw();URL.revokeObjectURL(url)};loaded.onerror=()=>status('Could not open this image.');loaded.src=url};
function snapshot(){history.push(rc.getImageData(0,0,repair.width,repair.height));if(history.length>15)history.shift()}
function dab(p){if(!stroke)return;const radius=Number($('#brush').value),sx=p.x+stroke.dx,sy=p.y+stroke.dy;if(sx-radius<0||sy-radius<0||sx+radius>=canvas.width||sy+radius>=canvas.height)return;const source=document.createElement('canvas');source.width=canvas.width;source.height=canvas.height;const sc=source.getContext('2d');sc.drawImage(img,0,0);sc.drawImage(repair,0,0);rc.save();rc.beginPath();rc.arc(p.x,p.y,radius,0,Math.PI*2);rc.clip();rc.drawImage(source,sx-radius,sy-radius,radius*2,radius*2,p.x-radius,p.y-radius,radius*2,radius*2);rc.restore();draw()}
canvas.addEventListener('pointerdown',e=>{if(!img)return;const p=xy(e);if($('#tool').value==='text'){pos=p;draw();return}if($('#tool').value==='restore'){dragStart=p;selection={x:p.x,y:p.y,w:0,h:0};canvas.setPointerCapture(e.pointerId);draw();return}if(e.altKey){sample=p;status('Sample point set. Brush over the text to repair the pattern.');return}if(!sample){status('First hold Alt / Option and click a clean pattern area.');return}snapshot();stroke={dx:sample.x-p.x,dy:sample.y-p.y};painting=true;canvas.setPointerCapture(e.pointerId);dab(p)});
canvas.addEventListener('pointermove',e=>{if(dragStart){const p=xy(e);selection={x:Math.min(dragStart.x,p.x),y:Math.min(dragStart.y,p.y),w:Math.abs(p.x-dragStart.x),h:Math.abs(p.y-dragStart.y)};draw();return}if(painting)dab(xy(e))});
canvas.addEventListener('pointerup',()=>{painting=false;stroke=null;dragStart=null});canvas.addEventListener('pointercancel',()=>{painting=false;stroke=null});
function restoreSelection(){
 if(!img||!selection||selection.w<3||selection.h<3){status('Choose Smart pattern restoration and drag a rectangle around the lettering first.');return}
 const x=Math.round(selection.x),y=Math.round(selection.y),w=Math.round(selection.w),h=Math.round(selection.h);
 const full=document.createElement('canvas');full.width=canvas.width;full.height=canvas.height;
 const fc=full.getContext('2d',{willReadFrequently:true});fc.drawImage(img,0,0);fc.drawImage(repair,0,0);
 const pix=fc.getImageData(0,0,canvas.width,canvas.height).data,W=canvas.width,H=canvas.height;
 const offsets=[];const step=Math.max(3,Math.round(Math.min(w,h)/3));
 for(let distance=1;distance<=4;distance++)for(let side of [-1,1]){offsets.push([side*(w+distance*step),0],[0,side*(h+distance*step)]);}
 // Search source patches with the closest surrounding border. This preserves real source pixels.
 let best=null,bestScore=Infinity;
 for(const [dx,dy] of offsets){const sx=x+dx,sy=y+dy;if(sx<2||sy<2||sx+w>=W-2||sy+h>=H-2)continue;
 let score=0,n=0;const samples=Math.max(8,Math.min(70,Math.floor((w+h)/5)));
 for(let i=0;i<samples;i++){const t=i/(samples-1),bx=Math.round(x+t*(w-1)),by=Math.round(y+t*(h-1));
 for(const [ax,ay,cx,cy] of [[bx,y-2,bx+dx,y+dy-2],[bx,y+h+1,bx+dx,y+dy+h+1],[x-2,by,x+dx-2,by+dy],[x+w+1,by,x+dx+w+1,by+dy]]){
 if(ax<0||ay<0||cx<0||cy<0||ax>=W||cx>=W||ay>=H||cy>=H)continue;
 const a=(ay*W+ax)*4,b=(cy*W+cx)*4;for(let c=0;c<3;c++)score+=Math.abs(pix[a+c]-pix[b+c]);n++;
 }}if(n&&score/n<bestScore){bestScore=score/n;best=[sx,sy]}}
 if(!best){status('Not enough clean nearby fabric. Try a smaller selection or use the manual clone brush.');return}
 snapshot();const [sx,sy]=best;const feather=Math.max(2,Math.min(12,Math.floor(Math.min(w,h)/8)));
 const patch=fc.getImageData(sx,sy,w,h);const output=rc.createImageData(w,h);
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4;for(let c=0;c<3;c++)output.data[i+c]=patch.data[i+c];output.data[i+3]=Math.round(255*Math.min(1,(xx+1)/feather,(yy+1)/feather,(w-xx)/feather,(h-yy)/feather));}
 const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').putImageData(output,0,0);rc.drawImage(tmp,x,y);selection=null;draw();status('Pattern restored using a nearby real-image patch. Inspect edges at high zoom; use clone brush to refine.');
}
$('#restoreBtn').onclick=restoreSelection;
$('#undo').onclick=()=>{if(history.length){rc.putImageData(history.pop(),0,0);draw()}};
$('#clear').onclick=()=>{if(img){snapshot();rc.clearRect(0,0,repair.width,repair.height);draw()}};
for(const id of ['words','color','size'])$('#'+id).addEventListener('input',draw);
$('#toggle').onclick=()=>{visible=!visible;draw()};
function save(data,name){const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
$('#png').onclick=()=>canvas.toBlob(blob=>blob&&save(blob,'nexus-preview.png'));
$('#export').onclick=()=>{if(!img){status('Upload an image first.');return}const source=document.createElement('canvas');source.width=canvas.width;source.height=canvas.height;const sc=source.getContext('2d');sc.drawImage(img,0,0);const psd={width:canvas.width,height:canvas.height,children:[{name:'Replacement text (editable)',hidden:!visible,text:{text:$('#words').value,transform:[1,0,0,1,pos.x,pos.y],style:{font:{name:'Arial-BoldMT'},fontSize:Number($('#size').value),fillColor:$('#color').value},paragraphStyle:{alignment:'center'}}},{name:'Pattern repairs',canvas:repair},{name:'Original image (untouched)',canvas:source}]};try{save(new Blob([writePsd(psd)],{type:'application/octet-stream'}),'nexus-design.psd');status('PSD created. Check text compatibility in your Photoshop version.')}catch(err){status('PSD export error: '+err.message)}};
draw();
