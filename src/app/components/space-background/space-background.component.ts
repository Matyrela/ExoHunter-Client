import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';

@Component({
  selector: 'app-space-background',
  template: `<canvas #canvas></canvas>`,
  styleUrls: ['./space-background.component.scss']
})
export class SpaceBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId?: number;
  private readonly clock = new THREE.Clock();
  private loader!: GLTFLoader;
  private webbModel?: THREE.Group;
  private scrollOffset = 0;

  disableMouseEffect = false;

  ngOnInit(): void {
    this.initScene();
    this.animate();
  }

  // === 🧩 CONFIGURAR ESCENA ===
  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth ?? window.innerWidth;
    const height = canvas.parentElement?.clientHeight ?? window.innerHeight;

    console.log('Iniciando escena Three.js', { width, height });

    // 🌌 Escena
    this.scene = new THREE.Scene();

    // 🎥 Cámara
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 8);

    // ⚙️ Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 💡 Luces sutiles
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const directionalLight = new THREE.DirectionalLight(0xbcd0ff, 0.6);
    directionalLight.position.set(5, 3, 2);
    this.scene.add(ambientLight, directionalLight);

    // 🛰️ Cargar modelos
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);

    // 🪐 James Webb
    this.loader.load('jameswebb.glb',
      (gltf) => {
        this.webbModel = gltf.scene;
        const model = this.webbModel;
        model.scale.set(0.18, 0.18, 0.18);
        model.position.set(-7, -3.2, -3);
        model.rotation.set(0.15, -Math.PI / 3.5, 0.2);
        this.scene.add(model);

      const animateModel = () => {
        const t = this.clock.getElapsedTime();
        model.rotation.y += 0.002;
        model.position.y = -3.2 + Math.sin(t * 0.6) * 0.1;
        requestAnimationFrame(animateModel);
      };
      animateModel();
    },
    undefined,
    (error) => {
      console.error('Error cargando James Webb:', error);
    });

    // 🌍 Proxima B
    this.loader.load('proximab.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.0035, 0.0035, 0.0035);
        model.position.set(8, 3, -4);
        model.rotation.set(0, Math.PI / 2, 0);
        this.scene.add(model);

        const rotatePlanet = () => {
          model.rotation.y += 0.002;
          requestAnimationFrame(rotatePlanet);
        };
        rotatePlanet();
      },
      undefined,
      (error) => {
        console.error('Error cargando Proxima B:', error);
      });

    // 📏 Eventos
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  // 🖱️ Movimiento leve con mouse
  private readonly onMouseMove = (event: MouseEvent) => {
    if (this.disableMouseEffect) return;

    const x = (event.clientX / window.innerWidth - 0.5);
    const y = -(event.clientY / window.innerHeight - 0.5);
    this.camera.position.x = x * 0.3;
    this.camera.position.y = y * 0.2;
    this.camera.lookAt(0, 0, 0);
  };

  // 📜 Efecto con scroll (parallax de profundidad)
  @HostListener('window:scroll')
  onScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY === 0) {
      this.disableMouseEffect = false;
    } else {
      this.disableMouseEffect = true;
    }
    this.scrollOffset = scrollY / window.innerHeight;

    // la cámara se aleja y rota suavemente
    this.camera.position.z = 8 + this.scrollOffset * 2.5;
    this.camera.rotation.x = this.scrollOffset * 0.35;
  }

  // 🔄 Animación global
  private readonly animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  // 📏 Resize handler
  private readonly onWindowResize = () => {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth ?? window.innerWidth;
    const height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // 🧹 Limpieza
  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId!);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }
}
