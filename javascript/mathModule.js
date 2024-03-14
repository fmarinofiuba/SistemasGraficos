// math.js

// Exportando una función
export function suma(a, b) {
    return a + b;
}

// Exportando una variable
export const pi = 3.14159;

// Exportando una clase
export class Circulo {
    constructor(radio) {
        this.radio = radio;
    }

    area() {
        return Math.PI * this.radio * this.radio;
    }
}
