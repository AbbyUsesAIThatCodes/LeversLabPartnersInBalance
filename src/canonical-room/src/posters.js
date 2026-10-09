import * as THREE from 'three';
import atlasUrl from './assets/quote-posters-data.js';
import metadata from './assets/quote-posters.json';
export const posterAtlas = new THREE.Texture();
posterAtlas.name='Quote_Posters_Pages_1_38';
posterAtlas.colorSpace=THREE.SRGBColorSpace;
posterAtlas.minFilter=THREE.LinearMipmapLinearFilter;
posterAtlas.magFilter=THREE.LinearFilter;
posterAtlas.generateMipmaps=true;
export const postersReady=new Promise((resolve,reject)=>{
 const image=new Image();
 image.onload=()=>{posterAtlas.image=image;posterAtlas.needsUpdate=true;resolve();};
 image.onerror=()=>reject(new Error('Quote poster atlas could not be loaded'));
 image.src=atlasUrl;
});
export function posterGeometry(page,width=.47){
 const e=metadata.entries[page-1];if(!e)throw new Error('No finished poster page '+page);
 const geometry=new THREE.PlaneGeometry(width,width*e.height/e.width);
 const uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(e.x+uv.getX(i)*e.width)/metadata.atlasWidth,1-(e.y+(1-uv.getY(i))*e.height)/metadata.atlasHeight);
 return geometry;
}
