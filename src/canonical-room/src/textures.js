import * as THREE from 'three';

function canvas(width, height, paint) {
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  paint(c.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
function random(seed = 73) {return () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};}
export function blockTexture(width, height) {
  const t = canvas(1024, 512, (c, w, h) => {
    c.fillStyle = '#e8e3cc'; c.fillRect(0, 0, w, h);
    const rand = random();
    for (let i = 0; i < 2000; i++) {c.fillStyle = `rgba(104,98,72,${rand() * .055})`; c.fillRect(rand()*w,rand()*h,2,2);}
    for (let row=0;row<8;row++) {
      const y=row*64;c.strokeStyle='#cfcbb7';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
      c.strokeStyle='#f4efdf';c.beginPath();c.moveTo(0,y+2);c.lineTo(w,y+2);c.stroke();
      for(let col=-1;col<8;col++){const x=col*128+(row%2)*64;c.strokeStyle='#d2ceba';c.beginPath();c.moveTo(x,y);c.lineTo(x,y+64);c.stroke();}
    }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(width/3.2,height/1.6);return t;
}
export function floorTexture() {
  return canvas(1024,2048,(c,w,h)=>{
    const rand=random(123);const nx=23,nz=46;
    for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){
      const r=rand(),v=Math.floor(rand()*7);
      c.fillStyle = r<.022?'#79413a':r<.043?'#586061':r<.077?'#ac9270':`rgb(${205+v},${199+v},${177+v})`;
      c.fillRect(x*w/nx,z*h/nz,w/nx,h/nz);
      c.strokeStyle='rgba(100,91,70,.14)';c.lineWidth=.8;c.strokeRect(x*w/nx,z*h/nz,w/nx,h/nz);
    }
    for(let i=0;i<8000;i++){c.fillStyle=rand()<.5?'rgba(255,251,224,.15)':'rgba(74,64,46,.12)';c.fillRect(rand()*w,rand()*h,1.5,1.5);}
  });
}
export function woodTexture() {
  const t=canvas(1024,512,(c,w,h)=>{
    const rand=random(29);c.fillStyle='#b78c5b';c.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=32){c.fillStyle=`rgba(255,232,179,${rand()*.14})`;c.fillRect(0,y,w,31);c.fillStyle='#967048';c.fillRect(0,y,w,1);
      for(let i=0;i<12;i++){c.strokeStyle=`rgba(78,46,20,${rand()*.15})`;c.lineWidth=rand()+.3;c.beginPath();c.moveTo(0,y+rand()*32);c.bezierCurveTo(w*.3,y+rand()*32,w*.6,y+rand()*32,w,y+rand()*32);c.stroke();}}
  });return t;
}
export function ceilingTexture() {
  const t=canvas(256,256,(c,w,h)=>{const rand=random();c.fillStyle='#eeebe1';c.fillRect(0,0,w,h);for(let i=0;i<2000;i++){c.fillStyle=`rgba(109,105,93,${rand()*.15})`;c.fillRect(rand()*w,rand()*h,1,1);}c.strokeStyle='#bbb9af';c.lineWidth=3;c.strokeRect(0,0,w,h);});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7/.61,14/.61);return t;
}
export function signTexture(title, lines=[], accent='#3f7770', kind='poster') {
  return canvas(768,512,(c,w,h)=>{
    if(kind==='exit'){c.fillStyle='#f3eede';c.fillRect(0,0,w,h);c.fillStyle='#c83f48';c.textAlign='center';c.textBaseline='middle';c.font='bold 210px sans-serif';c.fillText('EXIT',w/2,h/2);return;}
    c.fillStyle=kind==='screen'?'#cceee8':'#fbf8ee';c.fillRect(0,0,w,h);
    c.fillStyle=accent;c.fillRect(0,0,w,90);c.fillStyle='#ffffff';c.font='bold 38px sans-serif';c.fillText(title,30,59);
    c.fillStyle='#253d40';c.font='25px sans-serif';lines.forEach((s,i)=>c.fillText(s,34,140+i*42));
    if(kind==='screen'){
      c.strokeStyle=accent;c.lineWidth=7;c.strokeRect(25,110,350,270);c.strokeRect(395,110,348,270);
      c.fillStyle='#294c4b';c.font='bold 26px sans-serif';c.fillText('Engineering',45,157);c.fillText('Design & Modeling',412,157);
      c.font='25px sans-serif';['Test it.','Record it.','Explain it.'].forEach((s,i)=>c.fillText(s,55,215+48*i));
      const x=510,y=242;c.strokeStyle='#5588a0';c.lineWidth=5;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+65,y-36);c.lineTo(x+130,y);c.lineTo(x+65,y+36);c.closePath();c.moveTo(x,y);c.lineTo(x,y+76);c.lineTo(x+65,y+112);c.lineTo(x+130,y+76);c.lineTo(x+130,y);c.moveTo(x+65,y+36);c.lineTo(x+65,y+112);c.stroke();
      c.fillStyle='#43877e';c.font='23px sans-serif';c.fillText('A room for curious minds.',32,463);
    }
  });
}
export function clockTexture(){return canvas(256,256,(c)=>{c.fillStyle='#fcfaf2';c.beginPath();c.arc(128,128,124,0,Math.PI*2);c.fill();c.fillStyle='#293839';c.textAlign='center';c.textBaseline='middle';c.font='23px serif';for(let n=1;n<=12;n++){const a=n/12*Math.PI*2;c.fillText(n,128+Math.sin(a)*97,128-Math.cos(a)*97);}c.strokeStyle='#263b3d';c.lineWidth=5;c.beginPath();c.moveTo(128,128);c.lineTo(173,156);c.moveTo(128,128);c.lineTo(67,160);c.stroke();c.fillStyle='#bf534c';c.beginPath();c.arc(128,128,6,0,Math.PI*2);c.fill();});}
