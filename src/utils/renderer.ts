import * as THREE from 'three';
import { BodyAnalysis, JewelryAnchors, JewelryItem, OrnamentTransform } from '../types';
import { getJewelryCutoutCanvas, getSingleEarringCanvas } from './imageUtils';
import { fitJewelry, FittedPiece } from './fitting';

type Instance = { item: JewelryItem; transform: OrnamentTransform; calibration?: JewelryAnchors };
const loader = new THREE.TextureLoader();

function disposeObject(object: THREE.Object3D, textures = false) {
  object.traverse(child => {
    const mesh=child as THREE.Mesh;
    mesh.geometry?.dispose();
    if(mesh.material) for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
      if(textures) (material as THREE.MeshBasicMaterial).map?.dispose();
      material.dispose();
    }
  });
}

export class TryOnRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-.5,.5,.5,-.5,1,10000);
  private group = new THREE.Group();
  private background?: THREE.Mesh;
  private raf=0;
  private playing=false;
  private disposed=false;
  private renderVersion=0;
  private backgroundVersion=0;
  private size={width:1,height:1};
  private source={width:896,height:1200};
  private textures=new Map<string,Promise<THREE.CanvasTexture>>();
  constructor(canvas: HTMLCanvasElement) {
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.camera.position.z=3000;
    this.scene.add(this.group,new THREE.AmbientLight(0xffffff,2));
    const key=new THREE.DirectionalLight(0xfff3d6,3);key.position.set(-300,600,1200);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,2);fill.position.set(500,-300,900);this.scene.add(fill);
  }
  resize(width:number,height:number) {
    this.size={width,height};this.renderer.setSize(width,height,false);this.updateCamera();this.draw();
  }
  private updateCamera() {
    const scale=Math.min(this.size.width/this.source.width,this.size.height/this.source.height);
    this.camera.left=-this.size.width/scale/2;this.camera.right=-this.camera.left;
    this.camera.top=this.size.height/scale/2;this.camera.bottom=-this.camera.top;
    this.camera.updateProjectionMatrix();
  }
  private replaceBackground(texture:THREE.Texture,width:number,height:number) {
    if(this.background){this.background.removeFromParent();disposeObject(this.background,true);}
    this.source={width,height};this.updateCamera();
    texture.colorSpace=THREE.SRGBColorSpace;
    this.background=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture}));
    this.background.position.z=-200;this.scene.add(this.background);this.draw();
  }
  async setBackground(url:string) {
    const version=++this.backgroundVersion;
    const texture=await loader.loadAsync(url);
    if(this.disposed || version!==this.backgroundVersion){texture.dispose();return;}
    this.replaceBackground(texture,texture.image.width,texture.image.height);
  }
  setVideo(video:HTMLVideoElement) {
    ++this.backgroundVersion;
    const texture=new THREE.VideoTexture(video);texture.minFilter=THREE.LinearFilter;
    this.replaceBackground(texture,video.videoWidth,video.videoHeight);
    this.playing=true;cancelAnimationFrame(this.raf);this.animate();
  }
  stopVideo(){this.playing=false;cancelAnimationFrame(this.raf);}
  async render(instances:Instance[],analysis:BodyAnalysis|null) {
    const version=++this.renderVersion;
    const next=new THREE.Group();
    for(const instance of instances.filter(i=>i.transform.visible)) {
      for(const fit of fitJewelry(instance.item,analysis,this.source,instance.calibration)) next.add(await this.createInstance(instance,fit));
    }
    if(this.disposed || version!==this.renderVersion){disposeObject(next);return;}
    this.group.removeFromParent();disposeObject(this.group);this.group=next;this.scene.add(next);this.draw();
  }
  private async texture(item:JewelryItem) {
    const key=item.imageUrl+':'+item.category+':'+item.asset?.earringLayout;
    if(!this.textures.has(key)) this.textures.set(key,(async()=>{
      const image=item.category==='earrings' && item.asset?.earringLayout!=='single' ? await getSingleEarringCanvas(item.imageUrl) : await getJewelryCutoutCanvas(item.imageUrl);
      const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;
      if(this.disposed) texture.dispose();
      return texture;
    })());
    return this.textures.get(key)!;
  }
  private async createInstance({item,transform}:Instance,fit:FittedPiece) {
    const root=new THREE.Group();
    root.position.set(fit.center.x-this.source.width/2+transform.x*this.source.width,this.source.height/2-fit.center.y+transform.y*this.source.height,0);
    root.rotation.z=-THREE.MathUtils.degToRad(fit.rotation+transform.rotation);root.scale.setScalar(transform.scale);
    if(item.asset?.renderMode==='procedural-3d' && (item.category==='ring'||item.category==='bangles')) {
      this.createBand(root,fit.width,item.category==='ring',transform.opacity);return root;
    }
    const texture=await this.texture(item);
    const width=fit.width,height=fit.height ?? width*texture.image.height/texture.image.width;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:transform.opacity,depthWrite:false}));
    mesh.position.set((.5-fit.attachment.x)*width,(fit.attachment.y-.5)*height,0);
    if(fit.mirror) mesh.scale.x=-1;
    root.add(mesh);return root;
  }
  /** Only the visible front of a worn band. The rear belongs behind the finger/wrist.
   * This is a fitted style proxy; a calibrated product mesh is needed for exact design fidelity. */
  private createBand(root:THREE.Group,width:number,ring:boolean,opacity:number) {
    const gold=new THREE.MeshStandardMaterial({color:0xe4b84f,metalness:.48,roughness:.27,transparent:true,opacity});
    const white=new THREE.MeshStandardMaterial({color:0xf5f7ff,metalness:.18,roughness:.13,flatShading:true,transparent:true,opacity});
    const ruby=new THREE.MeshStandardMaterial({color:0x951d42,metalness:.25,roughness:.22,transparent:true,opacity});
    const radius=width/2;
    const bandDepth=width*(ring?.06:.19);
    // Front half-cylinder with its axis along the finger. Side edges turn away;
    // never draw the hidden back arc over the skin.
    const segments=48,vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
    for(let i=0;i<=segments;i++){
      const theta=i/segments*Math.PI;
      const x=-radius*Math.cos(theta),z=radius*.42*Math.sin(theta);
      const curve=-width*.09*Math.sin(theta);
      vertices.push(x,curve-bandDepth/2,z,x,curve+bandDepth/2,z);uvs.push(i/segments,0,i/segments,1);
      if(i<segments){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    gold.side=THREE.DoubleSide;root.add(new THREE.Mesh(geometry,gold));
    const arc=(offset:number)=>new THREE.CatmullRomCurve3(Array.from({length:33},(_,i)=>{const t=i/32*Math.PI;return new THREE.Vector3(-radius*Math.cos(t),-width*.09*Math.sin(t)+offset,radius*.42*Math.sin(t));}));
    for(const sign of [-1,1]) root.add(new THREE.Mesh(new THREE.TubeGeometry(arc(sign*bandDepth/2),48,width*(ring?.013:.015),8,false),gold));
    if(ring){
      for(let i=1;i<12;i++){const t=i/12*Math.PI;const bead=new THREE.Mesh(new THREE.IcosahedronGeometry(width*.025,0),white);bead.position.set(-radius*Math.cos(t),-width*.09*Math.sin(t),radius*.42*Math.sin(t)+width*.015);root.add(bead);}
      const setting=new THREE.Mesh(new THREE.CylinderGeometry(width*.125,width*.09,width*.06,8),gold);setting.rotation.x=Math.PI/2;setting.position.set(0,-width*.09,radius*.42+width*.03);root.add(setting);
      const stone=new THREE.Mesh(new THREE.IcosahedronGeometry(width*.115,1),white);stone.scale.z=.55;stone.rotation.z=.3;stone.position.copy(setting.position);stone.position.z+=width*.06;root.add(stone);
      for(let i=0;i<4;i++){const t=Math.PI/4+i*Math.PI/2;const prong=new THREE.Mesh(new THREE.SphereGeometry(width*.017,8,6),gold);prong.position.set(Math.cos(t)*width*.105,-width*.09+Math.sin(t)*width*.105,stone.position.z);root.add(prong);}
    }else{
      for(let i=1;i<16;i++){
        const t=i/16*Math.PI,x=-radius*Math.cos(t),y=-width*.09*Math.sin(t),z=radius*.42*Math.sin(t);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(width*.035,width*.008,6,16),gold);rim.position.set(x,y,z+width*.016);root.add(rim);
        const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(width*.028,1),ruby);gem.scale.y=1.3;gem.scale.z=.4;gem.position.set(x,y,z+width*.025);root.add(gem);
        for(const sign of [-1,1]) {const bead=new THREE.Mesh(new THREE.SphereGeometry(width*.016,8,6),gold);bead.position.set(x,y+sign*bandDepth*.36,z+width*.01);root.add(bead);}
      }
    }
  }
  private animate=()=>{if(!this.playing||this.disposed)return;this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(this.animate);};
  draw(){if(this.playing||this.disposed)return;cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(()=>{if(!this.disposed)this.renderer.render(this.scene,this.camera);});}
  export(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
  dispose(){this.disposed=true;this.playing=false;++this.renderVersion;++this.backgroundVersion;cancelAnimationFrame(this.raf);disposeObject(this.scene);(this.background?.material as THREE.MeshBasicMaterial)?.map?.dispose();this.textures.forEach(p=>p.then(t=>t.dispose()));this.textures.clear();this.renderer.dispose();}
}
