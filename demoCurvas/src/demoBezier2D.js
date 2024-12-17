let Base0, Base1, Base2, Base3;
let Base0der, Base1der, Base2der, Base3der;

let modo = 'cuadratica';

function curvaCuadratica(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0(u) * p0[0] + Base1(u) * p1[0] + Base2(u) * p2[0];
	punto.y = Base0(u) * p0[1] + Base1(u) * p1[1] + Base2(u) * p2[1];

	return punto;
}

function curvaCubica(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];
	let p3 = puntosDeControl[3];

	let punto = new Object();

	punto.x = Base0(u) * p0[0] + Base1(u) * p1[0] + Base2(u) * p2[0] + Base3(u) * p3[0];
	punto.y = Base0(u) * p0[1] + Base1(u) * p1[1] + Base2(u) * p2[1] + Base3(u) * p3[1];

	return punto;
}

function curvaCubicaDerivadaPrimera(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];
	let p3 = puntosDeControl[3];

	let punto = new Object();

	punto.x = Base0der(u) * p0[0] + Base1der(u) * p1[0] + Base2der(u) * p2[0] + Base3der(u) * p3[0];
	punto.y = Base0der(u) * p0[1] + Base1der(u) * p1[1] + Base2der(u) * p2[1] + Base3der(u) * p3[1];

	return punto;
}

function curvaCuadraticaDerivadaPrimera(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0der(u) * p0[0] + Base1der(u) * p1[0] + Base2der(u) * p2[0];
	punto.y = Base0der(u) * p0[1] + Base1der(u) * p1[1] + Base2der(u) * p2[1];

	return punto;
}

function setBases(cuales) {
	// Definimos las Bases de Berstein, dependen de u
	if (cuales == 'bezier3') {
		Base0 = function (u) {
			return (1 - u) * (1 - u) * (1 - u);
		}; // 1*(1-u) - u*(1-u) = 1-2u+u2  ,  (1-2u+u2) - u +2u2- u3 ,  1 - 3u +3u2 -u3

		Base1 = function (u) {
			return 3 * (1 - u) * (1 - u) * u;
		}; // 3*(1-u)*(u-u2) , 3*(u-u2-u2+u3), 3u -6u2+2u3

		Base2 = function (u) {
			return 3 * (1 - u) * u * u;
		}; //3u2-3u3

		Base3 = function (u) {
			return u * u * u;
		};

		// bases derivadas

		Base0der = function (u) {
			return -3 * u * u + 6 * u - 3;
		}; //-3u2 +6u -3

		Base1der = function (u) {
			return 9 * u * u - 12 * u + 3;
		}; // 9u2 -12u +3

		Base2der = function (u) {
			return -9 * u * u + 6 * u;
		}; // -9u2 +6u

		Base3der = function (u) {
			return 3 * u * u;
		}; // 3u2

		modo = 'cubica';
		console.log('setBases Bezier cubicas');
	} else if (cuales == 'bezier2') {
		Base0 = function (u) {
			return (1 - u) * (1 - u);
		}; // (1-u)^2

		Base1 = function (u) {
			return 2 * u * (1 - u);
		}; // 2*u*(1-u)

		Base2 = function (u) {
			return u * u;
		}; // u^2

		// bases derivadas

		Base0der = function (u) {
			return -2 + 2 * u;
		};

		Base1der = function (u) {
			return 2 - 4 * u;
		};

		Base2der = function (u) {
			return 2 * u;
		};

		console.log('setBases Bezier cuadráticas');
		modo = 'cuadratica';
	}
}

function dibujarCurvaCubica(puntosDeControl, dibujarGrafo) {
	// devuelve un punto de la curva segun el parametro u entre 0 y 1

	// 4 Puntos de control P0, P1, P2 y P3

	ctx.lineWidth = 2;
	// Dibujamos la curva en color azul, entre u=0 y u=1 con deltaU

	let deltaU = 0.01; // es el paso de avance sobre la curva cuanto mas chico mayor es el detalle
	// u=0.05 son 20 segmentos (0.05=1/20)
	ctx.clearRect(0, 0, 1000, 1000);
	ctx.beginPath();

	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];
	let p3 = puntosDeControl[3];

	ctx.strokeStyle = '#FF0000';

	if (dibujarGrafo) {
		ctx.beginPath();
		ctx.moveTo(p0[0], p0[1]);
		ctx.lineTo(p1[0], p1[1]);
		ctx.lineTo(p2[0], p2[1]);
		ctx.lineTo(p3[0], p3[1]);

		ctx.stroke();
	}

	ctx.beginPath();
	ctx.strokeStyle = '#0000FF';
	for (let u = 0; u <= 1.001; u = u + deltaU) {
		// Tengo que calcular la posicion del punto c(u)
		let punto = curvaCubica(u, puntosDeControl);

		if (u == 0) ctx.moveTo(punto.x, punto.y);
		ctx.lineTo(punto.x, punto.y); // hago una linea desde el ultimo lineTo hasta x,y

		//console.log("C("+u+")= "+punto.x+","+punto.y);
	}

	ctx.stroke();

	// Dibujo el grafo de control en color rojo, solo para verificar donde esta cada punto de control
}

function dibujarCurvaCuadratica(puntosDeControl, dibujarGrafo) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	ctx.lineWidth = 2;
	// Dibujamos la curva en color azul, entre u=0 y u=1 con deltaU

	let deltaU = 0.01; // es el paso de avance sobre la curva cuanto mas chico mayor es el detalle
	// u=0.05 son 20 segmentos (0.05=1/20)
	ctx.clearRect(0, 0, 1000, 1000);

	ctx.beginPath();
	ctx.strokeStyle = '#FF9900';

	if (dibujarGrafo) {
		ctx.beginPath();
		ctx.moveTo(p0[0], p0[1]);
		ctx.lineTo(p1[0], p1[1]);
		ctx.lineTo(p2[0], p2[1]);

		ctx.stroke();
	}

	ctx.beginPath();
	ctx.strokeStyle = '#0000FF';

	for (let u = 0; u <= 1.001; u = u + deltaU) {
		// Tengo que calcular la posicion del punto c(u)
		let punto = curvaCuadratica(u, puntosDeControl);

		if (u == 0) ctx.moveTo(punto.x, punto.y);
		ctx.lineTo(punto.x, punto.y); // hago una linea desde el ultimo lineTo hasta x,y

		//console.log("C("+u+")= "+punto.x+","+punto.y);
	}
	ctx.strokeStyle = '#0000FF';
	ctx.stroke();

	// Dibujo el grafo de control en color rojo, solo para verificar donde esta cada punto de control
}

function dibujarVector(x1, y1, x2, y2, color) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1 + x2, y1 + y2);
	ctx.strokeStyle = color;
	ctx.stroke();
}

function animate() {
	requestAnimationFrame(animate);

	let puntos;
	let fnCurva;
	let fnCurvaDer;
	let fnDibujarCurva;

	if (modo == 'cubica') {
		puntos = puntosDeControlCubica;
		fnCurva = curvaCubica;
		fnCurvaDer = curvaCubicaDerivadaPrimera;
		fnDibujarCurva = dibujarCurvaCubica;
	} else {
		puntos = puntosDeControlCuadratica;
		fnCurva = curvaCuadratica;
		fnCurvaDer = curvaCuadraticaDerivadaPrimera;
		fnDibujarCurva = dibujarCurvaCuadratica;
	}

	fnDibujarCurva(puntos, true);

	let punto = fnCurva(currentU, puntos);

	// dibujar punto de la curva en verde
	currentU += 0.002;
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(punto.x, punto.y, 10, 0, 2 * Math.PI);
	ctx.strokeStyle = '#00FF00';
	ctx.stroke();

	// dibujo el vector tangente
	let der = fnCurvaDer(currentU, puntos);
	//console.log(der);
	let modulo = Math.sqrt(der.x * der.x + der.y * der.y);
	der.x = (der.x * 50) / modulo;
	der.y = (der.y * 50) / modulo;

	dibujarVector(punto.x, punto.y, der.x, der.y, '#FF00FF');

	// dibujo el vector normal
	let normal = {
		x: -der.y,
		y: der.x,
	};
	dibujarVector(punto.x, punto.y, normal.x, normal.y, '#00FFFF');

	if (currentU > 1) currentU = 0;
}

let puntosDeControlCubica = [
	[100, 450],
	[200, 100],
	[600, 100],
	[700, 450],
];

let puntosDeControlCuadratica = [
	[100, 400],
	[400, 100],
	[700, 400],
];

let currentU = 0;

let c = document.getElementById('myCanvas');
let ctx = c.getContext('2d');

document.getElementById('bezier3').addEventListener('click', () => {
	setBases('bezier3');
});

document.getElementById('bezier2').addEventListener('click', () => {
	setBases('bezier2');
});

setBases('bezier2');
animate();
