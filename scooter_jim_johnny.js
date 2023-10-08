import {WebGLCanvas} from './base/helpers/WebGLCanvas.js';
import {WebGLShader} from './base/helpers/WebGLShader.js';
import {Camera} from './base/helpers/Camera.js';
import {isPowerOfTwo1, vectorToString} from "./base/lib/utility-functions.js";
import {ImageLoader} from "./base/helpers/ImageLoader.js";
import {Stack} from "./base/helpers/Stack.js";
import { createTexturedCube, createTexturedTrapezoid } from './shapes.js';
import {niceColors} from "./base/lib/utility-functions.js";

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, window.innerWidth, window.innerHeight);
	startProgram(webGLCanvas, true);
}

function startProgram(webGLCanvas, usePhong) {
	// Starter med å laste teksturer:
	let imageLoader = new ImageLoader();
	let textureUrls = [
		'./base/textures/textureBoard2.png',
		'./base/textures/wheelTexture-2.png',
		'./base/textures/greyTexture.png',
		'./base/textures/darkblueTexture.png',
		'./base/textures/darkGreyTexture.png',
		'./base/textures/handlebarTexture.png',
		'./base/textures/roadTexture.png',
		'./base/textures/metal1.png'
	];
	const chromeColor = niceColors.chrome;
	const dullColor = niceColors.dullChrome;
	imageLoader.load((textureImages) => {
		const textureImage = textureImages[0];
		const wheelTexture = textureImages[1];
		const greyTexture = textureImages[2];
		const darkblueTexture = textureImages[3];
		const darkGreyTexture = textureImages[4];
		const handlebarTexture = textureImages[5];
		const roadTexture = textureImages[6];
		const metalTexture = textureImages[7];
		if (isPowerOfTwo1(textureImage.width) && isPowerOfTwo1(wheelTexture.height)) {

			const renderInfo = {
				gl: webGLCanvas.gl,
				baseShader: initBaseShaders(webGLCanvas.gl),
				diffuseLightTextureShader: initDiffuseLightTextureShader(webGLCanvas.gl, usePhong),
				stack: new Stack(),

				coordBuffers: initCoordBuffers(webGLCanvas.gl),
				wheelRimBuffers: createCylinder(webGLCanvas.gl, textureImage, wheelTexture, 0, 0, 0, 0, 0.35),
				torusBuffers: createTorus(webGLCanvas.gl, wheelTexture),
				rearWheelCoverBuffers: createRearWheelCover(webGLCanvas.gl, darkblueTexture, darkblueTexture, 0, 0, 0, 0, 0.6),
				boardBuffers: createBoard(webGLCanvas.gl, textureImage, textureImage, 5, 1, 20, 2.5),
				rearBoxBuffers: createRearBox(webGLCanvas.gl, darkblueTexture),
				trapezoidBuffers: initTrapezoidBuffers(webGLCanvas.gl, darkblueTexture),
				axleBuffers: createCylinder(webGLCanvas.gl, darkGreyTexture, darkGreyTexture, 0, 0, 0, 0, 1),
				steeringPoleAttachmentBuffers: createCylinder(webGLCanvas.gl, darkblueTexture, darkblueTexture, 0, 0, 0, 0, 1),
				frontBoxBuffers: initFrontBoxBuffers(webGLCanvas.gl, darkblueTexture),
				steeringPoleBuffer: createCylinder(webGLCanvas.gl, darkblueTexture, darkblueTexture, 0, 0, 0, 0, 1),
				steeringAttachmentBuffers: createCylinder(webGLCanvas.gl, darkblueTexture, darkblueTexture, 0, 0, 0, 0, 1),
				handlebarBuffers: createCylinder(webGLCanvas.gl, greyTexture, greyTexture, 0, 0, 0, 0, 1),
				handleBuffers: createCylinder(webGLCanvas.gl, handlebarTexture, handlebarTexture, 0, 0, 0, 0, 1),
				worldBuffer: initWorldBuffers(webGLCanvas.gl, roadTexture),

				lightCubeBuffers: createLightCube(webGLCanvas.gl),
				

				currentlyPressedKeys: [],
				movement: {
					wheelRotation: 0.00,
					frontWheelRotation: 0.00,
					scooterFrontRotation: 0.00,
					moveWorld: 0.00,
					worldTurn: 0.00,
					bikeTurn: 0.00,
					keyVPressed: false,
					keyBPressed: false,
					originX: 0.00
				},
				lastTime: 0,
				fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
					frameCount: 0,
					lastTimeStamp: 0
				},
				light: {
					lightPosition: {x: 0.00, y:50.00, z: 50.00},

					ambientLightColor: chromeColor.ambient,
					diffuseLightColor: chromeColor.diffuse,
					specularLightColor: chromeColor.specular,
					shininess: chromeColor.shininess,
					intensity: chromeColor.intensity,

					ambientDullLightColor: dullColor.ambient,
					diffuseDullLightColor: dullColor.diffuse,
					specularDullLightColor: dullColor.specular,
					shininessDull: dullColor.shininess,
					intensityDull: dullColor.intensity,
				},
			};

			initKeyPress(renderInfo);
			const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
			camera.camPosX = 15.3;
			camera.camPosY = 16.4;
			camera.camPosZ = 29.7;

			document.getElementById('light-position').innerHTML = vectorToString(renderInfo.light.lightPosition);
			document.getElementById('ambient-light').innerHTML = vectorToString(renderInfo.light.ambientLightColor);
			document.getElementById('diffuse-light-color').innerHTML = vectorToString(renderInfo.light.diffuseLightColor);
			document.getElementById('specular-light-color').innerHTML = vectorToString(renderInfo.light.specularLightColor);
			document.getElementById('camera').innerHTML = camera.toString();

			animate( 0, renderInfo, camera);
		} else {
			console.log("Feil bildestørrelse");
		}
	}, textureUrls);
}

/**
 * Knytter tastatur-evnents til eventfunksjoner.
 */
function initKeyPress(renderInfo) {
	let lastMousePos = {};
	let mouse1Pressed = false;

	const directions = {
		x: { positive: 'moveXLeft', negative: 'moveXRight' },
		y: { positive: 'moveYUp', negative: 'moveYDown' }
	};

	function handleDirection(dir, value, lastValue, key) {
		if (lastValue !== undefined) {
			let direction = Math.sign(value - lastValue);
			if (direction !== 0) {
				let directionKey = directions[key][direction > 0 ? 'positive' : 'negative'];
				renderInfo.currentlyPressedKeys[directionKey] = true;
				setTimeout(() => { renderInfo.currentlyPressedKeys[directionKey] = false; }, 100);
			}
		}
		lastMousePos[key] = value;
	}

	document.addEventListener('keyup', (event) => {
		renderInfo.currentlyPressedKeys[event.code] = false;
	}, false);

	document.addEventListener('keydown', (event) => {
		renderInfo.currentlyPressedKeys[event.code] = true;
	}, false);

	//Slippe musknapp 1
	document.addEventListener("mouseup", (event) => {
		if (event.button === 0) {
			mouse1Pressed = false;
			document.body.style.cursor = 'auto'; // Show the cursor
		}
	}, false);

	//Trykke musknapp 1
	document.addEventListener("mousedown", (event) => {
		if (event.button === 0) {
			mouse1Pressed = true;
			document.body.style.cursor = 'none'; // Hide the cursor
		}
	}, false);

	//Bruker ikke Y, ref camera.js, umulig å styre uten quaternion om kameraet står på X-aksen.
	document.addEventListener("mousemove", (event) => {
		if (mouse1Pressed) {
			handleDirection('x', event.clientX, lastMousePos.x, 'x');
			handleDirection('y', event.clientY, lastMousePos.y, 'y');
		}
	}, false);

	//Zoom
	document.addEventListener('wheel', (event) => {
		let dir = Math.sign(event.deltaY);
		if (dir > 0) {
			renderInfo.currentlyPressedKeys['mousewheeldown'] = true;
			setTimeout(() => { renderInfo.currentlyPressedKeys['mousewheeldown'] = false; }, 100);
			dir = 0;
		}
		if (dir < 0) {
			renderInfo.currentlyPressedKeys['mousewheelup'] = true;
			setTimeout(() => { renderInfo.currentlyPressedKeys['mousewheelup'] = false; }, 100);
		}
	}, false);
}

function initBaseShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('base-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('base-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}

/**
 * Lysberegning  gjøres i fragmenshaderen.
 * @param gl
 * @returns {{uniformLocations: {normalMatrix: WebGLUniformLocation, lightPosition: WebGLUniformLocation, projectionMatrix: WebGLUniformLocation, diffuseLightColor: WebGLUniformLocation, modelMatrix: WebGLUniformLocation, ambientLightColor: WebGLUniformLocation, modelViewMatrix: WebGLUniformLocation}, attribLocations: {vertexNormal: GLint, vertexPosition: GLint}, program: (null|*)}}
 */
function initDiffuseLightTextureShader(gl, usePhongShading = true) {

	if (usePhongShading)
		document.getElementById('gourad-phong').innerHTML = 'PHONG';
	else
		document.getElementById('gourad-phong').innerHTML = 'GOURAD';

	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = undefined;
	let fragmentShaderSource = undefined;
	if (usePhongShading) {
		vertexShaderSource = document.getElementById('diffuse-pointlight-phong-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('diffuse-pointlight-phong-fragment-shader').innerHTML;
	} else {
		vertexShaderSource = document.getElementById('diffuse-pointlight-gourad-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('diffuse-pointlight-gourad-fragment-shader').innerHTML;
	}
	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexNormal: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexNormal'),
			vertexTextureCoordinate: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexTextureCoordinate'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
			modelMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelMatrix'),
			normalMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uNormalMatrix'),

			lightPosition: gl.getUniformLocation(glslShader.shaderProgram, 'uLightPosition'),
			cameraPosition: gl.getUniformLocation(glslShader.shaderProgram, 'uCameraPosition'),
			ambientLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uAmbientLightColor'),
			diffuseLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uDiffuseLightColor'),
			specularLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uSpecularLightColor'),

			shininess: gl.getUniformLocation(glslShader.shaderProgram, 'uShininess'),
			intensity: gl.getUniformLocation(glslShader.shaderProgram, 'uIntensity'),

			sampler: gl.getUniformLocation(glslShader.shaderProgram, 'uSampler'),
		},
	};
}

function initCoordBuffers(gl) {
	const extent =  100;

	const positions = new Float32Array([
		-extent, 0, 0,
		extent, 0, 0,
		0, -extent, 0,
		0, extent, 0,
		0, 0, -extent,
		0, 0, extent
	]);

	const colors = new Float32Array([
		1,0,0,1,   //R G B A
		1,0,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,0,1,1,   //R G B A
		0,0,1,1,   //R G B A
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}

function initTrapezoidBuffers(gl, textureImage) {
	let cube = createTexturedTrapezoid();

	const cubePositionBuffer = gl.createBuffer();
	bufferBinder(gl, cubePositionBuffer ,cube.positionArray);
	const cubeNormalsBuffer = gl.createBuffer();
	bufferBinder(gl, cubeNormalsBuffer ,cube.normalArray);

	const cubeTexture = gl.createTexture();
   
   gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);  
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

   gl.bindTexture(gl.TEXTURE_2D, null);
	
	
	const cubeTextureBuffer = gl.createBuffer();
	bufferBinder(gl, cubeTextureBuffer, cube.textureArray);

	return {
		position: cubePositionBuffer,
		normal: cubeNormalsBuffer,
		texture: cubeTextureBuffer,
		vertexCount: cube.positionArray.length/3,
		textureObject: cubeTexture,
	};
};

function initFrontBoxBuffers(gl, textureImage){

	let basePlate = createTexturedCube()
	const basePlatePositionBuffer = gl.createBuffer();
	bufferBinder(gl, basePlatePositionBuffer ,basePlate.positionArray);
	const basePlateNormalsBuffer = gl.createBuffer();
	bufferBinder(gl, basePlateNormalsBuffer ,basePlate.normalArray);

	const cubeTexture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	gl.bindTexture(gl.TEXTURE_2D, null);
		
		
	const basePlateTextureBuffer = gl.createBuffer();
	bufferBinder(gl, basePlateTextureBuffer, basePlate.textureArray);

	return {
		position: basePlatePositionBuffer,
		normal: basePlateNormalsBuffer,
		texture: basePlateTextureBuffer,
		vertexCount: basePlate.positionArray.length/3,
		textureObject: cubeTexture,
	};
	

}

function initWorldBuffers(gl, textureImage){

	let world = createTexturedCube()
	const worldPositionBuffer = gl.createBuffer();
	bufferBinder(gl, worldPositionBuffer ,world.positionArray);
	const worldNormalBuffer = gl.createBuffer();
	bufferBinder(gl, worldNormalBuffer ,world.normalArray);

	const worldTexture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, worldTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	gl.bindTexture(gl.TEXTURE_2D, null);
		
		
	const worldTextureBuffer = gl.createBuffer();
	bufferBinder(gl, worldTextureBuffer, world.textureArray);

	return {
		position: worldPositionBuffer,
		normal: worldNormalBuffer,
		texture: worldTextureBuffer,
		vertexCount: world.positionArray.length/3,
		textureObject: worldTexture,
	};
}

function calculateSphereNormalForVertex(x, y, z) {
	let normal = vec3.fromValues(x,y,z);
	let normalisertNormal = vec3.create();
	vec3.normalize(normalisertNormal, normal);
	return normalisertNormal;
}

function createCircle(gl, textureImage, input_x, input_y, input_z, isTop) {
	let positions = [];
	let toPI = 2 * Math.PI;
	let stepGrader = 360 / 40;
	let step = (Math.PI / 180) * stepGrader;
	let textureCoordinates = [];
	let normals = [];
	let maxTextureCoordinate = 0.52734;

	for (let phi = 0.0; phi <= toPI; phi += step) {
		let x = Math.cos(phi) + input_x;
		let y = Math.sin(phi) +input_y;
		let z = input_z;
		positions = positions.concat(x, y, z);
		let u = ((Math.cos(phi) + 1) / 2) * maxTextureCoordinate;
		let v = ((Math.sin(phi) + 1) / 2) * maxTextureCoordinate;
		textureCoordinates = textureCoordinates.concat(u,v);
		let normal = isTop ? [0, 0, 1] : [0, 0, -1];
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
	}

	const circleTexture = gl.createTexture();
	bindTexture(gl, circleTexture, textureImage);
	const textureBuffer = gl.createBuffer();
	bufferBinder(gl, textureBuffer, textureCoordinates);
	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, positions);
	const normalBuffer = gl.createBuffer();
	bufferBinder(gl, normalBuffer, normals);

	return  {
		position: positionBuffer,
		positionRaw: positions,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: circleTexture,
		vertexCount: positions.length/3,
	};
}

function bufferBinder(gl, buffer, data) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function createTorus(gl, textureImage) {
	const color = {red:0.8, green:0.1, blue:0.6, alpha:1};
	const slices = 50;
	const loops = 200;
	const inner_rad = 0.2;
	const outer_rad = 1.0;

	let positions = [];
	let colors = [];
	let indices = [];
	let textureCoordinates = [];
	let normals = [];

	for (let slice = 0; slice <= slices; ++slice) {
		const v = slice / slices;
		const slice_angle = v * 2 * Math.PI;
		const cos_slices = Math.cos(slice_angle);
		const sin_slices = Math.sin(slice_angle);
		const slice_rad = outer_rad + inner_rad * cos_slices;

		for (let loop = 0; loop <= loops; ++loop) {
			const u = loop / loops;
			const loop_angle = u * 2 * Math.PI;
			const cos_loops = Math.cos(loop_angle);
			const sin_loops = Math.sin(loop_angle);

			const x = slice_rad * cos_loops;
			const y = slice_rad * sin_loops;
			const z = inner_rad * sin_slices;

			//Position:
			positions.push(x, y, z);
			//Color:
			colors.push(color.red, color.green, color.blue, color.alpha);

			const uCoord = u;
			const vCoord = 1 - (v * 0.263671875);

			// Push the texture coordinates
			textureCoordinates.push(uCoord);
			textureCoordinates.push(vCoord);

			//Normals:
			// Calculate the center of the tube
			let cx = cos_loops * outer_rad;
			let cy = sin_loops * outer_rad;
			// Calculate the vector from the center of the tube to the point on the surface
			let nx = x - cx;
			let ny = y - cy;
			let nz = z;
			// Normalize the vector to get the normal
			let length = Math.sqrt(nx*nx + ny*ny + nz*nz);
			nx /= length;
			ny /= length;
			nz /= length;
			// Push the normal to your normals array
			normals.push(nx, ny, nz);
		}
	}

	const vertsPerSlice = loops + 1;

	for (let i = 0; i < slices; ++i) {
		let v1 = i * vertsPerSlice;
		let v2 = v1 + vertsPerSlice;

		for (let j = 0; j < loops; ++j) {

			indices.push(v1);
			indices.push(v1 + 1);
			indices.push(v2);

			indices.push(v2);
			indices.push(v1 + 1);
			indices.push(v2 + 1);

			v1 += 1;
			v2 += 1;
		}
	}

	//Texture:
	const torusTexture = gl.createTexture();
	bindTexture(gl, torusTexture, textureImage);

	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, new Float32Array(positions));

	const colorBuffer = gl.createBuffer();
	bufferBinder(gl, colorBuffer, new Float32Array(colors));

	const normalBuffer = gl.createBuffer();
	bufferBinder(gl, normalBuffer, new Float32Array(normals));

	const textureCoordBuffer = gl.createBuffer();
	bufferBinder(gl, textureCoordBuffer, new Float32Array(textureCoordinates));

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		normal: normalBuffer,
		texture: textureCoordBuffer,
		textureObject: torusTexture,
		index: indexBuffer,
		vertexCount: positions.length/3,
		indicesCount: indices.length
	};
}

function createRearWheelCover(gl, wallTextureImage, textureImage, xStart, yStart, xStop, yStop, thickness) {
	let innerWall = createRearWheelCoverWall(gl, wallTextureImage, textureImage, xStart, yStart, xStop, yStop, thickness, 0.675);
	let outerWall = createRearWheelCoverWall(gl, wallTextureImage, textureImage, xStart, yStart, xStop, yStop, thickness, 0.72);
	let positions = [];
	let normals = [];
	let textureCoordinates = [];

	for (let i = 0; i < outerWall.positionRaw.length; i += 3) {
		positions.push(outerWall.positionRaw[i], outerWall.positionRaw[i + 1], outerWall.positionRaw[i + 2]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 0);

		positions.push(innerWall.positionRaw[i], innerWall.positionRaw[i + 1], innerWall.positionRaw[i + 2]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 1);

		let normalOuter = calculateSphereNormalForVertex(outerWall.positionRaw[i], outerWall.positionRaw[i + 1], outerWall.positionRaw[i + 2]);
		normals.push(normalOuter[0], normalOuter[1], normalOuter[2]);

		let normalInner = calculateSphereNormalForVertex(innerWall.positionRaw[i], innerWall.positionRaw[i + 1], innerWall.positionRaw[i + 2]);
		normals.push(normalInner[0], normalInner[1], normalInner[2]);
	}

	for (let i = 0; i < outerWall.positionRaw.length; i += 6) {
		positions.push(outerWall.positionRaw[i], outerWall.positionRaw[i + 1], outerWall.positionRaw[i + 2]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 0);

		positions.push(innerWall.positionRaw[i], innerWall.positionRaw[i + 1], innerWall.positionRaw[i + 2]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 1);

		let normalOuter = calculateSphereNormalForVertex(outerWall.positionRaw[i], outerWall.positionRaw[i + 1], outerWall.positionRaw[i + 2]);
		normals.push(normalOuter[0], normalOuter[1], normalOuter[2]);

		let normalInner = calculateSphereNormalForVertex(innerWall.positionRaw[i], innerWall.positionRaw[i + 1], innerWall.positionRaw[i + 2]);
		normals.push(normalInner[0], normalInner[1], normalInner[2]);
	}

	for (let i = outerWall.positionRaw.length; i >= 0; i -= 6) {
		positions.push(outerWall.positionRaw[i + 3], outerWall.positionRaw[i + 4], outerWall.positionRaw[i + 5]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 0);

		positions.push(innerWall.positionRaw[i + 3], innerWall.positionRaw[i + 4], innerWall.positionRaw[i + 5]);
		textureCoordinates = textureCoordinates.concat(i / outerWall.positionRaw.length, 1);

		let normalOuter = calculateSphereNormalForVertex(outerWall.positionRaw[i], outerWall.positionRaw[i + 1], outerWall.positionRaw[i + 2]);
		normals.push(normalOuter[0], normalOuter[1], normalOuter[2]);

		let normalInner = calculateSphereNormalForVertex(innerWall.positionRaw[i], innerWall.positionRaw[i + 1], innerWall.positionRaw[i + 2]);
		normals.push(normalInner[0], normalInner[1], normalInner[2]);
	}

	const wheelCoverSideTexture = gl.createTexture();
	bindTexture(gl, wheelCoverSideTexture, wallTextureImage);

	const textureBuffer = gl.createBuffer();
	const positionBuffer = gl.createBuffer();
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	bufferBinder(gl, positionBuffer, positions);
	bufferBinder(gl, normalBuffer, normals);

	return {
		outerWall: outerWall,
		innerWall: innerWall,
		position: positionBuffer,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: wheelCoverSideTexture,
		vertexCount: positions.length/3
	};
}

function createRearWheelCoverWall(gl, wallTextureImage, textureImage, xStart, yStart, xStop, yStop, thickness, size) {
	let topCircle = createPartCircle(gl, textureImage, xStart, yStart, thickness/2, true, size);
	let bottomCircle = createPartCircle(gl, textureImage, xStop, yStop, -(thickness/2), false, size);
	let positions = [];
	let normals = [];
	let textureCoordinates = [];

	for (let i = 0; i <= topCircle.positionRaw.length; i += 3){
		positions.push(topCircle.positionRaw[i], topCircle.positionRaw[i+1], topCircle.positionRaw[i+2])
		textureCoordinates = textureCoordinates.concat(i/(topCircle.positionRaw.length),0);
		positions.push(bottomCircle.positionRaw[i], bottomCircle.positionRaw[i+1], bottomCircle.positionRaw[i+2])
		textureCoordinates = textureCoordinates.concat(i/(topCircle.positionRaw.length),1);
		let normal = calculateSphereNormalForVertex(topCircle.positionRaw[i], topCircle.positionRaw[i+1], topCircle.positionRaw[i+2]);
		normals.push(normal[0], normal[1], normal[2])
		normal = calculateSphereNormalForVertex(bottomCircle.positionRaw[i], bottomCircle.positionRaw[i+1], bottomCircle.positionRaw[i+2]);
		normals.push(normal[0], normal[1], normal[2])
	}

	const cylinderWallTexture = gl.createTexture();
	bindTexture(gl, cylinderWallTexture, wallTextureImage);

	const textureBuffer = gl.createBuffer();
	const positionBuffer = gl.createBuffer();
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	bufferBinder(gl, positionBuffer, positions);
	bufferBinder(gl, normalBuffer, normals);

	return {
		topCircle: topCircle,
		bottomCircle: bottomCircle,
		position: positionBuffer,
		positionRaw: positions,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: cylinderWallTexture,
		vertexCount: positions.length/3
	};
}

function createPartCircle(gl, textureImage, input_x, input_y, input_z, isTop, size) {
	let positions = [];
	let toPI = 2 * Math.PI;
	let stepGrader = 360 / 40;
	let step = (Math.PI / 180) * stepGrader;
	let textureCoordinates = [];
	let normals = [];
	let maxTextureCoordinate = 1;

	for (let phi = 0.0; phi <= (8 * Math.PI) / 12; phi += step) {
		let x = Math.cos(phi) * size + input_x;
		let y = Math.sin(phi) * size + input_y;
		let z = input_z;
		positions = positions.concat(x, y, z);
		let u = ((Math.cos(phi) + 1) / 2) * maxTextureCoordinate;
		let v = ((Math.sin(phi) + 1) / 2) * maxTextureCoordinate;
		textureCoordinates = textureCoordinates.concat(u,v);
		let normal = isTop ? [0, 0, 1] : [0, 0, -1];
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
	}

	const circleTexture = gl.createTexture();
	bindTexture(gl, circleTexture, textureImage);
	const textureBuffer = gl.createBuffer();
	bufferBinder(gl, textureBuffer, textureCoordinates);
	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, positions);
	const normalBuffer = gl.createBuffer();
	bufferBinder(gl, normalBuffer, normals);

	return  {
		position: positionBuffer,
		positionRaw: positions,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: circleTexture,
		vertexCount: positions.length/3,
	};
}

function createCylinder(gl, wallTextureImage, textureImage, xStart, yStart, xStop, yStop, thickness) {
	let topCircle = createCircle(gl, textureImage, xStart, yStart, thickness/2, true);
	let bottomCircle = createCircle(gl, textureImage, xStop, yStop, -(thickness/2), false);
	let positions = [];
	let normals = [];
	let textureCoordinates = [];

	for (let i = 0; i <= topCircle.positionRaw.length; i += 3){
		positions.push(topCircle.positionRaw[i], topCircle.positionRaw[i+1], topCircle.positionRaw[i+2])
		textureCoordinates = textureCoordinates.concat(i/(topCircle.positionRaw.length),0);
		positions.push(bottomCircle.positionRaw[i], bottomCircle.positionRaw[i+1], bottomCircle.positionRaw[i+2])
		textureCoordinates = textureCoordinates.concat(i/(topCircle.positionRaw.length),1);
		let normal = calculateSphereNormalForVertex(topCircle.positionRaw[i], topCircle.positionRaw[i+1], topCircle.positionRaw[i+2]);
		normals.push(normal[0], normal[1], normal[2])
		normal = calculateSphereNormalForVertex(bottomCircle.positionRaw[i], bottomCircle.positionRaw[i+1], bottomCircle.positionRaw[i+2]);
		normals.push(normal[0], normal[1], normal[2])
	}

	const cylinderWallTexture = gl.createTexture();
	bindTexture(gl, cylinderWallTexture, wallTextureImage);

	const textureBuffer = gl.createBuffer();
	const positionBuffer = gl.createBuffer();
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	bufferBinder(gl, positionBuffer, positions);
	bufferBinder(gl, normalBuffer, normals);

	return {
		topCircle: topCircle,
		bottomCircle: bottomCircle,
		position: positionBuffer,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: cylinderWallTexture,
		vertexCount: positions.length/3
	};
}

function createLightCube(gl) {
	const positions = new Float32Array([
		// Front face
		-1.0, -1.0,  1.0, // Bottom-left
		1.0, -1.0,  1.0, // Bottom-right
		-1.0,  1.0,  1.0, // Top-left
		1.0,  1.0,  1.0, // Top-right

		// Back face
		-1.0, -1.0, -1.0, // Bottom-left
		1.0, -1.0, -1.0, // Bottom-right
		-1.0,  1.0, -1.0, // Top-left
		1.0,  1.0, -1.0, // Top-right

		// Top face
		-1.0,  1.0,  1.0, // Front-top-left
		1.0,  1.0,  1.0, // Front-top-right
		-1.0,  1.0, -1.0, // Back-top-left
		1.0,  1.0, -1.0, // Back-top-right

		// Bottom face
		-1.0, -1.0,  1.0, // Front-bottom-left
		1.0, -1.0,  1.0, // Front-bottom-right
		-1.0, -1.0, -1.0, // Back-bottom-left
		1.0, -1.0, -1.0, // Back-bottom-right

		// Left face
		-1.0, -1.0,  1.0, // Front-bottom-left
		-1.0,  1.0,  1.0, // Front-top-left
		-1.0, -1.0, -1.0, // Back-bottom-left
		-1.0,  1.0, -1.0, // Back-top-left

		// Right face
		1.0, -1.0,  1.0, // Front-bottom-right
		1.0,  1.0,  1.0, // Front-top-right
		1.0, -1.0, -1.0, // Back-bottom-right
		1.0,  1.0, -1.0, // Back-top-right
	]);

	const colors = new Float32Array([
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A

		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A

		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A

		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A

		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A

		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
		1, 1, 0, 1,   //R G B A
	]);

	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, positions);

	const colorBuffer = gl.createBuffer();
	bufferBinder(gl, colorBuffer, colors);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}

function createBoard(gl, textureImage) {
	let normals = [];
	let positions = [
		//Forsiden (pos):
		-1, 1, 1,
		-1,-1, 1,
		1,-1, 1,

		-1,1,1,
		1,-1,1,
		1,1,1,

		//Høyre side:
		1,1,1,
		1,-1,1,
		1,-1,-1,

		1,1,1,
		1,-1,-1,
		1,1,-1,

		//Baksiden (pos):
		1,-1,-1,
		-1,-1,-1,
		1, 1,-1,

		-1,-1,-1,
		-1,1,-1,
		1,1,-1,

		//Venstre side:
		-1,-1,-1,
		-1,1,1,
		-1,1,-1,

		-1,-1,1,
		-1,1,1,
		-1,-1,-1,

		//Topp:
		-1,1,1,
		1,1,1,
		-1,1,-1,

		-1,1,-1,
		1,1,1,
		1,1,-1,

		//Bunn:
		-1,-1,-1,
		1,-1,1,
		-1,-1,1,

		-1,-1,-1,
		1,-1,-1,
		1,-1,1,
	];

	// Front face normals
	for (let i = 0; i < 6; i++) {
		normals.push(0, 0, 1);
	}

	// Right face normals
	for (let i = 0; i < 6; i++) {
		normals.push(1, 0, 0);
	}

	// Back face normals
	for (let i = 0; i < 6; i++) {
		normals.push(0, 0, -1);
	}

	// Left face normals
	for (let i = 0; i < 6; i++) {
		normals.push(-1, 0, 0);
	}

	// Top face normals
	for (let i = 0; i < 6; i++) {
		normals.push(0, 1, 0);
	}

	// Bottom face normals
	for (let i = 0; i < 6; i++) {
		normals.push(0, -1, 0);
	}

	let color = {red: 1.0, green: 0.45, blue: 0.9, alpha: 1.0}
	let colors = [];
	//Samme farge på alle sider:
	for (let i = 0; i < 36; i++) {
		colors.push(color.red, color.green, color.blue, color.alpha);
	}

	// Teksturkoordinater / UV-koordinater:
	//Setter uv-koordinater for hver enkelt side av terningen vha. en enkel tekstur.
	//Teksturen / .png-fila må se slik ut, dvs. 2 linjer og 3 kolonner, der hver celle
	//inneholder et "bilde" av et tall (1-6).
	// -------------
	// | 1 | 2 | 3 |
	// |-----------|
	// | 4 | 5 | 6 |
	// -------------

	//Holder etter hvert p� alle uv-koordinater for terningen.
	let textureCoordinates = [];
	//Front (1-tallet):
	let tl1=[0,0];
	let bl1=[0.2,0];
	let tr1=[0,0.13];
	let br1=[0.2,0.13];
	textureCoordinates = textureCoordinates.concat(tl1, bl1, br1, tl1, br1, tr1);

	//Høyre side (2-tallet):
	let tl2=[0,0];
	let bl2=[0.2,0];
	let tr2=[0,1];
	let br2=[0.2,1];
	textureCoordinates = textureCoordinates.concat(tl2, bl2, br2, tl2, br2, tr2);

	//Baksiden (6-tallet):
	let tl3=[0,0];
	let bl3=[0.2,0];
	let tr3=[0,0.13];
	let br3=[0.2,0.13];
	textureCoordinates = textureCoordinates.concat(bl3, br3, tl3, br3, tr3, tl3);

	//Venstre (5-tallet):
	let tl4=[0,0];
	let bl4=[0.2,0];
	let tr4=[0,1];
	let br4=[0.2,1];
	textureCoordinates = textureCoordinates.concat(bl4, tr4, tl4, br4, tr4, bl4);

	//Toppen (3-tallet):
	let tl5=[0.5,1];
	let bl5=[0.5,0];
	let tr5=[1,1];
	let br5=[1,0];
	textureCoordinates = textureCoordinates.concat(bl5, br5, tl5, tl5, br5, tr5);

	//Bunnen (4-tallet):
	let tl6=[0,1];
	let bl6=[0,0];
	let tr6=[0.5,1];
	let br6=[0.5,0];
	textureCoordinates = textureCoordinates.concat(tr6, bl6, br6,tr6,tl6, bl6);



	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, positions);

	const boardTexture = gl.createTexture();
	bindTexture(gl, boardTexture, textureImage);

	const textureBuffer = gl.createBuffer();
	bufferBinder(gl, textureBuffer, textureCoordinates);

	const normalsBuffer = gl.createBuffer();
	bufferBinder(gl, normalsBuffer, normals);

	return  {
		position: positionBuffer,
		texture: textureBuffer,
		textureObject: boardTexture,
		normal: normalsBuffer,
		vertexCount: positions.length/3
	};
}

function createRearBox(gl, textureImage) {
	let rearBox = createTexturedCube()

	const positionBuffer = gl.createBuffer();
	bufferBinder(gl, positionBuffer, rearBox.positionArray);

	const boardTexture = gl.createTexture();
	bindTexture(gl, boardTexture, textureImage);

	const textureBuffer = gl.createBuffer();
	bufferBinder(gl, textureBuffer, rearBox.textureArray);

	const normalsBuffer = gl.createBuffer();
	bufferBinder(gl, normalsBuffer, rearBox.normalArray);

	return {
		position: positionBuffer,
		texture: textureBuffer,
		textureObject: boardTexture,
		normal: normalsBuffer,
		vertexCount: rearBox.positionArray.length/3
	}
}

function bindTexture(gl, texture, textureImage) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);

}

function connectPositionAttribute(gl, shader, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
}

function connectColorAttribute(gl, shader, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexColor);
}

function connectNormalAttribute(gl, shader, normalBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
}

function connectAmbientUniform(gl, shader, color) {
	gl.uniform4f(shader.uniformLocations.ambientLightColor, color.r,color.g,color.b, color.a);
}

function connectDiffuseUniform(gl, shader,color) {
	gl.uniform4f(shader.uniformLocations.diffuseLightColor, color.r,color.g,color.b, color.a);
}

function connectLightPositionUniform(gl, shader, position) {
	gl.uniform3f(shader.uniformLocations.lightPosition, position.x,position.y,position.z);
}

function connectCameraPositionUniform(gl, shader, camera) {
	gl.uniform3f(shader.uniformLocations.cameraPosition, camera.camPosX, camera.camPosY, camera.camPosZ);
}

function connectSpecularUniform(gl, shader,color) {
	gl.uniform4f(shader.uniformLocations.specularLightColor, color.r, color.g, color.b, color.a);
}

function connectShininessUniform(gl, shader, value) {
	gl.uniform1f(shader.uniformLocations.shininess, value);
}

function connectIntensityUniform(gl, shader, value) {
	gl.uniform1f(shader.uniformLocations.intensity, value);
}

/**
 * Kopler til og aktiverer teksturkoordinat-bufferet.
 */
function connectTextureAttribute(gl, textureShader, textureBuffer, textureObject) {
	const numComponents = 2;    //NB!
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	//Bind til teksturkoordinatparameter i shader:
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(
		textureShader.attribLocations.vertexTextureCoordinate,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(textureShader.attribLocations.vertexTextureCoordinate);

	//Aktiver teksturenhet (0):
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureObject);
	//Send inn verdi som indikerer hvilken teksturenhet som skal brukes (her 0):
	let samplerLoc = gl.getUniformLocation(textureShader.program, textureShader.uniformLocations.sampler);
	gl.uniform1i(samplerLoc, 0);
}

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);
	camera.handleKeys(elapsed);

	document.getElementById('camera').innerHTML = camera.toString();
	document.getElementById('light-position').innerHTML = vectorToString(renderInfo.light.lightPosition);
	rotation(renderInfo);
	draw(currentTime, renderInfo, camera);
}

/**
 * Beregner forløpt tid siden siste kall.
 * @param currentTime
 * @param renderInfo
 */
function getElapsed(currentTime, renderInfo) {
	let elapsed = 0.0;
	if (renderInfo.lastTime !== 0.0)	// Først gang er lastTime = 0.0.
		elapsed = (currentTime - renderInfo.lastTime)/1000; // Deler på 1000 for å operere med sekunder.
	renderInfo.lastTime = currentTime;						// Setter lastTime til currentTime.
	return elapsed;
}

/**
 * Beregner og viser FPS.
 * @param currentTime
 * @param renderInfo
 */
function calculateFps(currentTime, fpsInfo) {
	if (!currentTime) currentTime = 0;
	// Sjekker om  ET sekund har forløpt...
	if (currentTime - fpsInfo.lastTimeStamp >= 1000) {
		// Viser FPS i .html ("fps" er definert i .html fila):
		document.getElementById('fps').innerHTML = fpsInfo.frameCount;
		// Nullstiller fps-teller:
		fpsInfo.frameCount = 0;
		//Brukes for å finne ut om det har gått 1 sekund - i så fall beregnes FPS på nytt.
		fpsInfo.lastTimeStamp = currentTime;
	}
	// Øker antall frames per sekund:
	fpsInfo.frameCount++;
}

function clearCanvas(gl) {
	gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL); // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Tegner!
 */
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);
	drawCoord(renderInfo, camera);
	drawScooter(renderInfo, camera);
	drawLightCube(renderInfo, camera);
	drawWorld(renderInfo, camera);
}

function drawCoord(renderInfo, camera) {
	renderInfo.gl.useProgram(renderInfo.baseShader.program);
	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.color);

	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	// Tegn coord:
	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.coordBuffers.vertexCount);
}

function drawScooter(renderInfo, camera) {
	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	renderInfo.stack.pushMatrix(modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.scale(1, 1, 1);
	modelMatrix.translate(renderInfo.movement.originX, 0, 0);
	modelMatrix.rotate(renderInfo.movement.bikeTurn, 0, 1, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawBoard(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(4.65, 0, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawRearWheelCover(renderInfo, camera, modelMatrix);
	modelMatrix.rotate(180, 0, 1 ,0)
	drawWheel(renderInfo, camera, modelMatrix);
	modelMatrix.rotate(-180, 0, 1 ,0)
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(0, 0, 0);
	drawAxle(renderInfo, camera, modelMatrix);
	renderInfo.stack.popMatrix();
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(-4.23, 0.8, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	drawTexturedTrapezoid(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(-0.8, 0.85, 0);  //-0.5, 0.7, 0)
	//sammenlegging
	modelMatrix.rotate(renderInfo.movement.scooterFrontRotation, 0, 0, 1);
	//sammenleggning slutt
	renderInfo.stack.pushMatrix(modelMatrix);
	drawSteeringPoleAttachment(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(-0.11, -0.85, 0);  //-0.12, -0.73, 0
	modelMatrix.rotate(renderInfo.movement.frontWheelRotation, 0, 1, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawFrontWheelAttachment(renderInfo, camera, modelMatrix); 
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(-0.10, -0.8, 0);  
	renderInfo.stack.pushMatrix(modelMatrix);
	modelMatrix.rotate(180, 0, 1 ,0)
	drawWheel(renderInfo, camera, modelMatrix);
	modelMatrix.rotate(-180, 0, 1 ,0)
	modelMatrix.translate(0, 0, 0);
	modelMatrix.scale(2, 2, 0.9);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawAxle(renderInfo, camera, modelMatrix);
	renderInfo.stack.popMatrix();
	renderInfo.stack.popMatrix();
	renderInfo.stack.popMatrix();
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(0.55, 4.5, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawSteeringPole(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(0.5, 4, 0);
	modelMatrix.rotate(renderInfo.movement.frontWheelRotation, 0, 1, 0);
	renderInfo.stack.pushMatrix(modelMatrix);
	drawSteeringAttachment(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	drawHandlebar(renderInfo, camera, modelMatrix);
	modelMatrix = renderInfo.stack.peekMatrix();
	modelMatrix.translate(0, 0, 1.45);
	drawHandle(renderInfo, camera, modelMatrix);
	

}

function drawTexturedLighted3DShape(renderInfo, camera, drawType, drawMethod, modelMatrix, buffer, dull = false) {
	renderInfo.gl.useProgram(renderInfo.diffuseLightTextureShader.program);
	camera.set();
	let modelViewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!

	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelMatrix, false, modelMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelViewMatrix, false, modelViewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);
	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightTextureShader.uniformLocations.normalMatrix, false, normalMatrix);
	connectLightPositionUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.lightPosition);
	if (dull === false) {
		connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.ambientLightColor);
		connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.diffuseLightColor);
		connectSpecularUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.specularLightColor);
		connectShininessUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.shininess);
		connectIntensityUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.intensity);
	}

	if (dull === true) {
		connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.ambientDullLightColor);
		connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.diffuseDullLightColor);
		connectSpecularUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.specularDullLightColor);
		connectShininessUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.shininessDull);
		connectIntensityUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.intensityDull);
	}


	connectCameraPositionUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, camera);

	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, buffer.position);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, buffer.normal);
	connectTextureAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, buffer.texture, buffer.textureObject);
	if (drawMethod === "array") {
		renderInfo.gl.drawArrays(drawType, 0, buffer.vertexCount);
	}
	if (drawMethod === "elements") {
		renderInfo.gl.bindBuffer(renderInfo.gl.ELEMENT_ARRAY_BUFFER, buffer.index);
		renderInfo.gl.drawElements(drawType, buffer.indicesCount, renderInfo.gl.UNSIGNED_SHORT, 0);
	}
}

function drawRearWheelCover(renderInfo, camera, modelMatrix) {
	modelMatrix.rotate(65, 0, 0, 1);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.rearWheelCoverBuffers.outerWall);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.rearWheelCoverBuffers.innerWall);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.rearWheelCoverBuffers);
}

function drawWheel(renderInfo, camera, modelMatrix) {
	modelMatrix.scale(0.5, 0.5, 1);
	modelMatrix.rotate(renderInfo.movement.wheelRotation*3, 0, 0, 1)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "elements", modelMatrix, renderInfo.torusBuffers, true);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.wheelRimBuffers.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.wheelRimBuffers.bottomCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.wheelRimBuffers);
}

function drawLightCube(renderInfo, camera) {
	renderInfo.gl.useProgram(renderInfo.baseShader.program);
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.lightCubeBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.lightCubeBuffers.color);
	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(renderInfo.light.lightPosition.x, renderInfo.light.lightPosition.y, renderInfo.light.lightPosition.z)
	modelMatrix.rotate(0, 0, 1, 0);
	modelMatrix.scale(0.2,0.2,0.2);
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	for (let i = 0; i < 6; i++) {
		renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_STRIP, i * 4, 4);
	}
}

function drawTexturedTrapezoid(renderInfo, camera, modelMatrix) {
	modelMatrix.rotate(270, 0, 1, 0);
	modelMatrix.rotate(40, 1, 0, 0);
	modelMatrix.scale(0.2, 0.23, 0.23)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.trapezoidBuffers);
 }

function drawBoard(renderInfo, camera, modelMatrix) {
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.scale(0.5, 0.15, 4);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.boardBuffers, true);

	modelMatrix.translate(0.8,0,1.1);
	modelMatrix.scale(0.2, 1, 0.1);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.rearBoxBuffers);

	modelMatrix.translate(-8,0,0);
	modelMatrix.rotate(0, 0, 1 ,0)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.rearBoxBuffers);
}

function drawAxle(renderInfo, camera, modelMatrix) {
	modelMatrix.scale(0.05, 0.05, 0.8)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.axleBuffers);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.axleBuffers.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.axleBuffers.bottomCircle);
}

function drawSteeringPoleAttachment(renderInfo, camera, modelMatrix) {
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.rotate(97, 1, 0, 0);
	modelMatrix.scale(0.34, 0.34, 1.7); //0.34, 0.34, 1.4
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.steeringPoleAttachmentBuffers);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringPoleAttachmentBuffers.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringPoleAttachmentBuffers.bottomCircle);
}

function drawFrontWheelAttachment(renderInfo, camera, modelMatrix){
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.rotate(7, 1, 0, 0);
	modelMatrix.scale(0.34, 0.04, 0.36)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.frontBoxBuffers);
	modelMatrix.translate(0.87, -11, 0)
	modelMatrix.rotate(0, 0, 0, 1);
	modelMatrix.scale(0.1, 12, 0.5)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.frontBoxBuffers);
	modelMatrix.translate(-17.3, 0, 0)
	modelMatrix.rotate(0, 0, 0, 1);
	modelMatrix.scale(1, 1, 1)
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.frontBoxBuffers);
}

function drawSteeringPole(renderInfo, camera, modelMatrix) {
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.rotate(97, 1, 0, 0);
	modelMatrix.rotate(-renderInfo.movement.frontWheelRotation, 0, 0, 1);
	modelMatrix.scale(0.18, 0.18, 8);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.steeringPoleBuffer);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringPoleBuffer.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringPoleBuffer.bottomCircle);
}

function drawSteeringAttachment(renderInfo, camera, modelMatrix) {
	modelMatrix.scale(0.2, 0.2, 0.8);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.steeringAttachmentBuffers);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringAttachmentBuffers.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.steeringAttachmentBuffers.bottomCircle);
}

function drawHandlebar(renderInfo, camera, modelMatrix) {
	modelMatrix.scale(0.12, 0.12, 4.5);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.handlebarBuffers);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handlebarBuffers.topCircle);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handlebarBuffers.bottomCircle);
}

function drawHandle(renderInfo, camera, modelMatrix) {
	modelMatrix.scale(0.16, 0.16, 1.5);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.handleBuffers, true);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handleBuffers.topCircle, true);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handleBuffers.bottomCircle, true);

	modelMatrix.translate(0, 0, -1.935);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_STRIP, "array", modelMatrix, renderInfo.handleBuffers, true);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handleBuffers.topCircle, true);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLE_FAN, "array", modelMatrix, renderInfo.handleBuffers.bottomCircle, true);
}

function drawWorld(renderInfo, camera){
	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	camera.set();
	modelMatrix.translate(renderInfo.movement.moveWorld, -1.65, 10);
	modelMatrix.rotate(0, 0, 1, 0)
	modelMatrix.scale(400, 1, 100);
	drawTexturedLighted3DShape(renderInfo, camera, renderInfo.gl.TRIANGLES, "array", modelMatrix, renderInfo.worldBuffer, true);
}

function rotation(renderInfo){
	//wheel rotation
	if (renderInfo.currentlyPressedKeys['KeyN'] &&
		!(renderInfo.currentlyPressedKeys['KeyV']) &&
		!(renderInfo.currentlyPressedKeys['KeyB'])){
		renderInfo.movement.wheelRotation -= 2;
		renderInfo.movement.moveWorld +=0.2;
	}
	if (renderInfo.currentlyPressedKeys['KeyM'] &&
		!(renderInfo.currentlyPressedKeys['KeyV']) &&
		!(renderInfo.currentlyPressedKeys['KeyB'])){
		renderInfo.movement.wheelRotation += 2;
		renderInfo.movement.moveWorld -=0.2;
	}

	//light position
	if (renderInfo.currentlyPressedKeys['KeyI']){
		renderInfo.light.lightPosition.y += 0.1;
	}
	if (renderInfo.currentlyPressedKeys['KeyK']){
		renderInfo.light.lightPosition.y -= 0.1;
	}

	if (renderInfo.currentlyPressedKeys['KeyL']){
		renderInfo.light.lightPosition.x += 0.1;
	}
	if (renderInfo.currentlyPressedKeys['KeyJ']){
		renderInfo.light.lightPosition.x -= 0.1;
	}

	if (renderInfo.currentlyPressedKeys['KeyU']){
		renderInfo.light.lightPosition.z += 0.1;
	}
	if (renderInfo.currentlyPressedKeys['KeyO']) {
		renderInfo.light.lightPosition.z -= 0.1;
	}

	if (renderInfo.currentlyPressedKeys['KeyV']) {
		if (renderInfo.movement.frontWheelRotation < 45) {
			renderInfo.movement.frontWheelRotation += 2;
		}
		renderInfo.movement.keyVPressed = true;
	} else {
		renderInfo.movement.keyVPressed = false;
	}

	if (renderInfo.currentlyPressedKeys['KeyB']) {
		if (renderInfo.movement.frontWheelRotation > -45) {
			renderInfo.movement.frontWheelRotation -= 2;
		}
		renderInfo.movement.keyBPressed = true;
	} else {
		renderInfo.movement.keyBPressed = false;
	}

	if (!renderInfo.movement.keyVPressed && !renderInfo.movement.keyBPressed) {
		let id = setInterval(function() {
			if (renderInfo.movement.frontWheelRotation > 0) {
				renderInfo.movement.frontWheelRotation -= 0.5;
			} else if (renderInfo.movement.frontWheelRotation < 0) {
				renderInfo.movement.frontWheelRotation += 0.5;
			} else {
				clearInterval(id);
			}
		}, 10)
	}
	if (renderInfo.currentlyPressedKeys['KeyF']) {
		renderInfo.movement.originX += 0.1;
		renderInfo.movement.wheelRotation += 2;
	}

	if (renderInfo.currentlyPressedKeys['KeyG']) {
		renderInfo.movement.originX -= 0.1;
		renderInfo.movement.wheelRotation -= 2;
	}

	if (renderInfo.currentlyPressedKeys['KeyZ'] && renderInfo.movement.scooterFrontRotation === -85) {
		let id = setInterval(function () {
			if (renderInfo.movement.scooterFrontRotation < 0) {
				renderInfo.movement.scooterFrontRotation += 1;
			} else {
				renderInfo.movement.flatPacked = false;
				clearInterval(id);
			}
		}, 10)
	}
	if (renderInfo.currentlyPressedKeys['KeyX'] && renderInfo.movement.scooterFrontRotation === 0) {
		let id = setInterval(function () {
			if (renderInfo.movement.scooterFrontRotation > -85) {
				renderInfo.movement.scooterFrontRotation -= 1;
			} else {
				renderInfo.movement.flatPacked = true;
				clearInterval(id);
			}
		}, 10)
	}
}

