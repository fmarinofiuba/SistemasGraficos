export const fragmentShader = `
precision mediump float;

    varying vec2 vUv;
    uniform float time;

	uniform sampler2D eifel;
    uniform sampler2D checker2;
	

void main() {
		vec2 uv=vUv;
		
		uv.x=uv.x+time/400.0;
		uv.y=uv.y+time/400.0;
		
		vec4 texColor=texture2D(eifel, uv); 		
       
        gl_FragColor = vec4(texColor.xyz,1.0);	
}

    `;
