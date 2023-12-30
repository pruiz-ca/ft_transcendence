/* eslint-disable import/no-unresolved */
/* eslint-disable import/named */
import {
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	Output,
	ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import * as conf from '../classes/config';
import {GameService} from 'app/services/game.service';
import {OrbitControls} from 'three-stdlib/controls/OrbitControls';
import {EffectComposer} from 'three-stdlib/postprocessing/EffectComposer';
import {UnrealBloomPass} from 'three-stdlib/postprocessing/UnrealBloomPass';
import {RenderPass} from 'three-stdlib/postprocessing/RenderPass';
import {Pane} from 'tweakpane';
import {LineMaterial} from 'three-stdlib/lines/LineMaterial';
import {LineSegments2} from 'three-stdlib/lines/LineSegments2';
import {LineSegmentsGeometry} from 'three-stdlib/lines/LineSegmentsGeometry';
import {Game} from '../classes/game';
import {Keys} from '../classes/utilities';
import {IGame} from '../../classes/Game';
import {Channel} from 'app/classes/Channel';
import {ChatService} from 'app/services/chat.service';
import {PongService} from 'app/services/pong.service';

@Component({
	selector: 'app-pong',
	templateUrl: './pong.component.html',
	styleUrls: ['./pong.component.css'],
})
export class PongComponent implements OnChanges, OnDestroy {
	@ViewChild('PongCanvas', {static: true}) canvas!: ElementRef;
	@ViewChild('PongContainer', {static: true})
		pongContainer!: ElementRef<HTMLDivElement>;
	@Input() gameRef!: IGame;
	@Input() options!: {ranked: boolean; powerups: boolean};
	@Output() closeSidenav = new EventEmitter();

	isChatting!: boolean;
	isFocused = true;

	/*
	 ** Channel Variables
	 */

	public channel?: Channel;

	/*
	 ** Game Variables
	 */
	public scrHeight = conf.scrHeight;
	public scrWidth = conf.scrWidth;
	public game: Game = new Game();
	public keys: Keys = new Keys();

	/*
	 ** Three.js Variables
	 */
	public scene: THREE.Scene = new THREE.Scene();
	public renderer!: THREE.WebGLRenderer;
	public controls!: OrbitControls;
	public composer!: EffectComposer;

	public ball!: THREE.Mesh;
	public p1!: THREE.Mesh;
	public p2!: THREE.Mesh;

	public initialHeight!: number;

	public p1EdgesMat: LineMaterial = new LineMaterial({
		color: new THREE.Color(0xff00ff),
		vertexColors: false,
		linewidth: 4,
	});

	public p2EdgesMat: LineMaterial = new LineMaterial({
		color: 0x00ffff,
		vertexColors: false,
		linewidth: 4,
	});

	public wallEdgesMat: LineMaterial = new LineMaterial({
		color: 0xffffff,
		vertexColors: false,
		linewidth: 4,
	});

	public floorEdgeMat: LineMaterial = new LineMaterial({
		color: 0xffffff,
		vertexColors: false,
		linewidth: 4,
	});

	constructor(
		private gameService: GameService,
		private pongService: PongService,
		private chatService: ChatService,
	) {
		this.startListeningSockets();
	}

	ngOnChanges(): void {
		this.gameService.getGame(this.gameRef.game_id).subscribe((ret) => {
			if (!ret) return;
			this.startGame(this.options);
		});

		this.chatService.channels$.subscribe((channels) => {
			const channel = channels.find(
				(channel) => channel.name == `game${this.gameRef.game_id}`,
			);
			if (!channel) return;
			this.channel = channel;
		});
	}

	ngOnDestroy() {
		this.gameService.gameSelector$.next(undefined);
	}

	startGame(event: {ranked: boolean; powerups: boolean}) {
		this.closeSidenav.emit();
		this.game.setPlayerIds(
			this.gameRef.player1.user_id,
			this.gameRef.player2.user_id,
		);
		this.game.isGameOver = false;
		this.gameService.emitStartGame({
			roomId: this.gameRef.game_id,
			event: event,
		});
		this.setup();
	}

	setup() {
		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('PongCanvas') as HTMLCanvasElement,
			antialias: true,
			powerPreference: 'high-performance',
		});
		this.createScene();
		this.renderFrame();
		this.resizeScreen();
	}

	startListeningSockets() {
		this.gameService.updatePositions(this.game);
		this.gameService.updateScore(this.game);
		this.gameService.playPlayerSound(this.game);
		this.gameService.gameOver(this.game);
		this.gameService.socketLog();
		this.gameService.matchMaker();
		this.gameService.getConfigFromServer(this.game);
	}
	stopListeningSockets() {
		this.gameService.socket.off('score');
		this.gameService.socket.off('playerHit');
		this.gameService.socket.off('matchmaking');
		this.gameService.socket.off('gameInfo');
		this.gameService.socket.off('gameOver');
		this.gameService.socket.off('gameConfig');
	}

	createScene() {
		/*
		 ** Camera
		 */
		const cam = new THREE.PerspectiveCamera(
			50,
			this.scrWidth / this.scrHeight,
			1,
			5000,
		);

		cam.position.set(0, 514, 0);
		cam.lookAt(0, 0, -1);

		/*
		 ** Background
		 */
		const bgMaterial = new THREE.MeshPhongMaterial({
			color: 0x000000,
			polygonOffset: true,
			polygonOffsetFactor: 1,
			polygonOffsetUnits: 1,
		});

		const floorGeometry = new THREE.BoxGeometry(
			conf.scrWidth + conf.pWidth * 2,
			conf.scrHeight + 2 * conf.pWidth,
			conf.pWidth,
			2,
			2,
			2,
		);

		const floorEdgeGeom = new LineSegmentsGeometry().fromEdgesGeometry(
			new THREE.EdgesGeometry(floorGeometry, 10),
		);

		const wallGeom = new THREE.BoxGeometry(
			conf.scrWidth + conf.pWidth * 2,
			conf.pWidth,
			conf.pWidth,
			2,
			2,
			2,
		);

		const wallEdgeGeom = new LineSegmentsGeometry().fromEdgesGeometry(
			new THREE.EdgesGeometry(wallGeom, 10),
		);

		const floor = new THREE.Mesh(floorGeometry, bgMaterial);
		const botWall: THREE.Mesh = new THREE.Mesh(wallGeom, bgMaterial);
		const topWall: THREE.Mesh = new THREE.Mesh(wallGeom, bgMaterial);

		const floorEdge = new LineSegments2(floorEdgeGeom, this.floorEdgeMat);
		const botWallEdges = new LineSegments2(wallEdgeGeom, this.wallEdgesMat);
		const topWallEdges = new LineSegments2(wallEdgeGeom, this.wallEdgesMat);

		this.scene.add(floor, botWall, topWall);
		floor.add(floorEdge);
		botWall.add(botWallEdges);
		topWall.add(topWallEdges);

		/*
		 ** Players and Ball
		 */
		const playerGeom = new THREE.BoxGeometry(
			conf.pWidth,
			this.game.playerHeight,
			conf.pWidth,
			2,
			2,
			2,
		);
		this.initialHeight = this.game.playerHeight;

		const playerMat = new THREE.MeshPhongMaterial({
			color: 0x000000,
			polygonOffset: true,
			polygonOffsetFactor: 1,
			polygonOffsetUnits: 1,
		});

		const p1EdgeGeometry = new LineSegmentsGeometry().fromEdgesGeometry(
			new THREE.EdgesGeometry(playerGeom, 10),
		);

		const ballGeom = new THREE.SphereGeometry(conf.bRadius);
		const ballMat = new THREE.MeshPhongMaterial({color: 0xffffff});

		this.p1 = new THREE.Mesh(playerGeom, playerMat);
		this.p2 = new THREE.Mesh(playerGeom, playerMat);
		this.ball = new THREE.Mesh(ballGeom, ballMat);

		const p1Edges = new LineSegments2(p1EdgeGeometry, this.p1EdgesMat);

		const p2EdgeGeometry = new LineSegmentsGeometry().fromEdgesGeometry(
			new THREE.EdgesGeometry(playerGeom, 10),
		);

		const p2Edges = new LineSegments2(p2EdgeGeometry, this.p2EdgesMat);

		this.p1.add(p1Edges);
		this.p2.add(p2Edges);
		this.scene.add(this.p1, this.p2, this.ball);

		/*
		 ** Object positions
		 */
		floor.position.z = -conf.pWidth - 1;
		botWall.position.y = -conf.scrHeight / 2 - conf.pWidth / 2;
		botWall.position.z -= 1;
		topWall.position.y = conf.scrHeight / 2 + conf.pWidth / 2;
		topWall.position.z -= 1;
		this.p1.position.x = -this.scrWidth / 2 + conf.pWidth;
		this.p2.position.x = this.scrWidth / 2 - conf.pWidth;

		/*
		 ** Ambient Light
		 */
		const ambLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(ambLight);

		/*
		 ** Bloom Effect
		 */
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(this.scrWidth, this.scrHeight),
			1,
			1,
			0.3,
		);

		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, cam));
		this.composer.addPass(bloomPass);

		/*
		 ** Mouse control
		 */
		this.controls = new OrbitControls(
			cam,
			document.getElementById('PongCanvas') as HTMLCanvasElement,
		);
		this.controls.rotateSpeed = 0.15;
		this.controls.panSpeed = 0.2;
		this.controls.zoomSpeed = 0.2;

		/*
		 ** Scene Settings
		 */
		this.scene.background = new THREE.Color(0x121212);
		this.scene.rotation.x = -Math.PI / 2;

		/*
		 ** GUI
		 */
		const pane = new Pane({
			container: document.getElementById('PongGUI') as HTMLElement,
		});

		const colors = pane.addFolder({title: 'Colors', expanded: false});
		colors.addInput(this.p1EdgesMat, 'color', {label: 'player 1'});
		colors.addInput(this.p2EdgesMat, 'color', {label: 'player 2'});
	}

	renderFrame() {
		requestAnimationFrame(() => this.renderFrame());
		this.composer.render();
		this.composer.renderer.getSize(this.p1EdgesMat.resolution);
		this.composer.renderer.getSize(this.p2EdgesMat.resolution);
		this.composer.renderer.getSize(this.wallEdgesMat.resolution);
		this.composer.renderer.getSize(this.floorEdgeMat.resolution);
		this.update();
	}

	update() {
		this.ball.position.x = this.game.ball.pos.x;
		this.ball.position.y = this.game.ball.pos.y;
		this.p1.position.y = this.game.player1.pos.y;
		this.p2.position.y = this.game.player2.pos.y;
		if (this.initialHeight !== this.game.playerHeight) {
			this.p1.scale.y = this.game.playerHeight / this.initialHeight;
			this.p2.scale.y = this.game.playerHeight / this.initialHeight;
			this.initialHeight = this.game.playerHeight;
		}
	}

	@HostListener('window:keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		let buttonPressed = false;

		if (this.isFocused) {
			if (event.code == 'KeyS' || event.code == 'ArrowDown') {
				if (this.keys.up == false) buttonPressed = true;
				this.keys.up = true;
			}

			if (event.code == 'KeyW' || event.code == 'ArrowUp') {
				if (this.keys.down == false) buttonPressed = true;
				this.keys.down = true;
			}

			if (buttonPressed) {
				this.gameService.emitKeyPress(this.keys);
				buttonPressed = false;
			}
		}
	}

	@HostListener('window:keyup', ['$event'])
	onKeyUp(event: KeyboardEvent) {
		const validKeys = ['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'];

		if (this.isFocused) {
			if (event.code == 'KeyS' || event.code == 'ArrowDown')
				this.keys.up = false;
			if (event.code == 'KeyW' || event.code == 'ArrowUp')
				this.keys.down = false;

			if (validKeys.includes(event.code)) {
				this.gameService.emitKeyPress(this.keys);
			}
		}
	}

	@HostListener('window:resize')
	resizeScreen() {
		const canvas = document.getElementById('PongCanvas');
		const div = document.getElementById('PongContainer');

		if (!canvas || !div) return;

		if (div.offsetWidth >= div.offsetHeight * conf.aspectRatio) {
			const w = div.offsetHeight * conf.aspectRatio;
			canvas.style.width = w.toString() + 'px';
			canvas.style.height = div.offsetHeight.toString() + 'px';
		} else {
			const h = div.offsetWidth / conf.aspectRatio;
			canvas.style.height = h.toString() + 'px';
			canvas.style.width = div.offsetWidth.toString() + 'px';
		}
	}

	goBack() {
		this.gameService.gameSelector$.next(undefined);
	}
}
