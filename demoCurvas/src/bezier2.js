let Base0, Base1, Base2;
let Base0der, Base1der, Base2der;

function Base0(u) {
	return (1 - u) * (1 - u);
} // (1-u)^2

function Base1(u) {
	return 2 * u * (1 - u);
} // 2*u*(1-u)

function Base2(u) {
	return u * u;
} // u^2

// bases derivadas

function Base0der(u) {
	return -2 + 2 * u;
}

function Base1der(u) {
	return 2 - 4 * u;
}

function Base2der(u) {
	return 2 * u;
}

export function Bezier2(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0(u) * p0[0] + Base1(u) * p1[0] + Base2(u) * p2[0];
	punto.y = Base0(u) * p0[1] + Base1(u) * p1[1] + Base2(u) * p2[1];

	return punto;
}

export function Bezier2Deriv(u, puntosDeControl) {
	let p0 = puntosDeControl[0];
	let p1 = puntosDeControl[1];
	let p2 = puntosDeControl[2];

	let punto = new Object();

	punto.x = Base0der(u) * p0[0] + Base1der(u) * p1[0] + Base2der(u) * p2[0];
	punto.y = Base0der(u) * p0[1] + Base1der(u) * p1[1] + Base2der(u) * p2[1];

	return punto;
}
