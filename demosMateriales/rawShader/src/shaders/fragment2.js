export const fragmentShader = `
precision mediump float;

    varying vec2 vUv;
    uniform float time;

	uniform sampler2D eifel;
    uniform sampler2D checker2;
	

void main() {
		vec2 uv=vUv*10.0;
		
        //  *****************************************
		uv.x=uv.x+time/40.0;
		uv.y=uv.y+time/40.0;

        // *****************************************

		float u=vUv.x-0.5;
		float v=vUv.y-0.5;
		
		float a=atan(u*(0.6+0.4*sin(time/3.0)),v);
		float r=sqrt(u*u+v*v);

		//uv=vec2(a+cos(time/33.0),r*40.0);

        // *****************************************

		vec4 texColor=texture2D(eifel, uv); 		
       
        gl_FragColor = vec4(texColor.xyz,1.0);	
}

    `;
