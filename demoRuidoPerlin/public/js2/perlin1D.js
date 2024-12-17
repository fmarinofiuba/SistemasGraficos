


//https://www.chartjs.org/docs/latest/charts/line.html

var APP = APP || {};

function drawChart(initialX,scaleX){

    let chartId="chart1";

    
    

       
    let totalSteps=400;
    let scale=10;

    var data={
        labels: [],        
        datasets: [
            {
                label:"red",
                pointRadius:0,
                lineTension:0,
                data:[],
                borderWidth:1,
                borderColor:"red"
            }
        ]
    }

    let perlin2D=window.NoiseFunctions.perlin2;

    for (var i=0;i<=totalSteps;i++){

        var x=initialX+(i/totalSteps);
        var y=  (perlin2D(x*1*scale*params.scaleX,0)+0.5)*params.amplitude3+
                (perlin2D(x*0.5*scale*params.scaleX,0)+0.5)*params.amplitude2+
                (perlin2D(x*0.1*scale*params.scaleX,0)+0.5)*params.amplitude1
        ;
        
        data.labels[i]=x.toFixed(2);
        data.datasets[0].data[i]=y;
    }

   var ctx = document.getElementById(chartId);

    // HELP version 2.9.4  https://www.chartjs.org/docs/2.9.4/

    var myChart = new Chart(ctx, {
        type: 'line',
        responsive:false,
        data: data,
        options: {
            animation:false,        
            title: {
                display: true,
                text: "serie1"
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            }, //https://www.chartjs.org/docs/2.9.4/axes/cartesian/
            scales: {

                xAxes: [{
                 /*   gridLines:{
                        display:false
                    },
                    ticks:{
                        autoSkip:true
                    }*/
                   
                }],
                yAxes: [{
                    gridLines:{
                        display:true
                    },
                    ticks: {
                        beginAtZero: true,
                        min:0,
                        max:10
                    },
                    min:0,
                    suggestedMax:10
                }]
            }
        }
    });

}

let params={
    offsetX:0,
    scaleX:1,
    amplitude1:3,
    amplitude2:2,
    amplitude3:1,
}

let frame=0;
function render(){
    
    requestAnimationFrame(render);

    if (frame%30==0){
        drawChart(params.offsetX,params.scaleX);
    }
}

render();

var gui = new dat.GUI();		
		
gui.add(params,"offsetX",0,2).step(0.01);
gui.add(params,"scaleX",0,50).step(0.01);

gui.add(params,"amplitude1",0,10).step(0.01);
gui.add(params,"amplitude2",0,10).step(0.01);
gui.add(params,"amplitude3",0,10).step(0.01);

// definimos una carpeta comandos en la variable f1