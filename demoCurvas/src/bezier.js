let Base0, Base1, Base2, Base3;
let Base0der, Base1der, Base2der, Base3der;

let modo = 'cuadratica';

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

function Bezier2(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0(u) * p0[0] + Base1(u) * p1[0] + Base2(u) * p2[0];
	punto.y = Base0(u) * p0[1] + Base1(u) * p1[1] + Base2(u) * p2[1];

	return punto;
}

function Bezier3(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];
	let p3 = puntosDeControl[3];

	let punto = new Object();

	punto.x = Base0(u) * p0[0] + Base1(u) * p1[0] + Base2(u) * p2[0] + Base3(u) * p3[0];
	punto.y = Base0(u) * p0[1] + Base1(u) * p1[1] + Base2(u) * p2[1] + Base3(u) * p3[1];

	return punto;
}

function Bezier3Deriv(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];
	let p3 = puntosDeControl[3];

	let punto = new Object();

	punto.x = Base0der(u) * p0[0] + Base1der(u) * p1[0] + Base2der(u) * p2[0] + Base3der(u) * p3[0];
	punto.y = Base0der(u) * p0[1] + Base1der(u) * p1[1] + Base2der(u) * p2[1] + Base3der(u) * p3[1];

	return punto;
}

function Bezier2Deriv(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0der(u) * p0[0] + Base1der(u) * p1[0] + Base2der(u) * p2[0];
	punto.y = Base0der(u) * p0[1] + Base1der(u) * p1[1] + Base2der(u) * p2[1];

	return punto;
}
