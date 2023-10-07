export function createTexturedCube() {

    let positionArray = [

          
    
                        -1, 1, -1, //top
                        1, 1, -1,
                        -1, 1, 1,

                        -1, 1, 1,
                        1, 1, -1,
                        1, 1, 1,

                        1, 1, 1, 
                        1, -1, 1,   
                        -1, -1, 1, 
                       

                        1, 1, 1,
                        -1, -1, 1,
                        -1, 1, 1, //front  

                       
                        1, -1, 1,
                        -1, -1, -1, //bottom
                        -1, -1, 1, 

                        1, -1, 1,
                        1, -1, -1,
                        -1, -1, -1,

                        1, -1, -1,
                        1, 1, 1,    //right
                        1, -1, 1,

                        1, 1, -1,
                        1, 1, 1,
                        1, -1, -1,

                        -1, 1, -1,  //left
                        -1, -1, -1,
                        -1, 1, 1,
                        
                        -1, -1, -1,
                        -1, -1, 1,
                        -1, 1, 1,
                        
                        -1, -1, -1,
                        -1, 1, -1,		//back
                        1, 1, -1,

                        -1, -1, -1,
                        1, 1, -1,
                        1, -1, -1,



                    
                    ];

    let  textureArray = [];
    let normalArray = [];
    
   
    textureArray = textureArray.concat(0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1);   //top
    textureArray = textureArray.concat(1,1, 1,0, 0,0, 1,1, 0, 0, 0,1); //front
    textureArray = textureArray.concat(1,1, 0,0, 0,1, 1,1, 1, 0, 0,0);    //bottom
    textureArray = textureArray.concat(1,0, 0,1, 0,0, 1,1, 0, 1, 1,0);    //right
    textureArray = textureArray.concat(0,1, 0,0, 1,1, 0,0, 1, 0, 1,1);  //left
    textureArray = textureArray.concat(1,0, 1,1, 0,1, 1,0, 0, 1, 0,0); //back


    normalArray = normalArray.concat(
                                    0,1,0,
                                    0,1,0, 
                                    0,1,0,

                                    0,1,0,
                                    0,1,0,
                                    0,1,0) //top

    normalArray = normalArray.concat(
                                    0,0,1,
                                    0,0,1,
                                    0,0,1,

                                    0,0,1,
                                    0,0,1,
                                    0,0,1) //front
    normalArray = normalArray.concat(
                                    0,-1,0,
                                    0,-1,0, 
                                    0,-1,0,

                                    0,-1,0,
                                    0,-1,0,
                                    0,-1,0) //bottom

    normalArray = normalArray.concat(
                                    1,0,0,
                                    1,0,0,
                                    1,0,0,

                                    1,0,0,
                                    1,0,0,
                                    1,0,0) //right

    normalArray = normalArray.concat(
                                    -1,0,0,
                                    -1,0,0,
                                    -1,0,0,

                                    -1,0,0,
                                    -1,0,0,
                                    -1,0,0) //left

    normalArray = normalArray.concat(
                                    0,0,-1,
                                    0,0,-1,
                                    0,0,-1,

                                    0,0,-1,
                                    0,0,-1,
                                    0,0,-1) //back
    

    let cubePositions = new Float32Array(positionArray);
    let cubeTextures = new Float32Array(textureArray);
    let cubeNormals = new Float32Array(normalArray);

    return {
        positionArray,
        textureArray,
        normalArray
    };
    
}



export function createTexturedTrapezoid() {

    let angle = 4.5;
    let length = 4;

    let positionArray = [

          
    
                        -1, angle, -1, //top
                        1, angle, -1,
                        -1, length, 1,

                        -1, length, 1,
                        1, angle, -1,
                        1, length, 1,

                        1, length, 1,  //front 
                        1, -length, 1,   
                        -1, -length, 1, 
                       

                        1, length, 1,
                        -1, -length, 1,
                        -1, length, 1,  

                       
                        1, -length, 1,
                        -1, -angle, -1, //bottom
                        -1, -length, 1, 

                        1, -length, 1,
                        1, -angle, -1,
                        -1, -angle, -1,

                        1, -angle, -1,
                        1, length, 1,    //right
                        1, -length, 1,

                        1, angle, -1,
                        1, length, 1,
                        1, -angle, -1,

                        -1, angle, -1,  //left
                        -1, -angle, -1,
                        -1, length, 1,
                        
                        -1, -angle, -1,
                        -1, -length, 1,
                        -1, length, 1,
                        
                        -1, -angle, -1,
                        -1, angle, -1,		//back
                        1, angle, -1,

                        -1, -angle, -1,
                        1, angle, -1,
                        1, -angle, -1,


                        



                    
                    ];

    let  textureArray = [];
    let normalArray = [];
    
   
    textureArray = textureArray.concat(0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1);   //top
    textureArray = textureArray.concat(1,1, 1,0, 0,0, 1,1, 0, 0, 0,1); //front
    textureArray = textureArray.concat(1,1, 0,0, 0,1, 1,1, 1, 0, 0,0);    //bottom
    textureArray = textureArray.concat(1,0, 0,1, 0,0, 1,1, 0, 1, 1,0);    //right
    textureArray = textureArray.concat(0,1, 0,0, 1,1, 0,0, 1, 0, 1,1);  //left
    textureArray = textureArray.concat(1,0, 1,1, 0,1, 1,0, 0, 1, 0,0); //back


    normalArray = normalArray.concat(
                                    0,1,0,
                                    0,1,0, 
                                    0,1,0,

                                    0,1,0,
                                    0,1,0,
                                    0,1,0) //top

    normalArray = normalArray.concat(
                                    0,0,1,
                                    0,0,1,
                                    0,0,1,

                                    0,0,1,
                                    0,0,1,
                                    0,0,1) //front
    normalArray = normalArray.concat(
                                    0,-1,0,
                                    0,-1,0, 
                                    0,-1,0,

                                    0,-1,0,
                                    0,-1,0,
                                    0,-1,0) //bottom

    normalArray = normalArray.concat(
                                    1,0,0,
                                    1,0,0,
                                    1,0,0,

                                    1,0,0,
                                    1,0,0,
                                    1,0,0) //right

    normalArray = normalArray.concat(
                                    -1,0,0,
                                    -1,0,0,
                                    -1,0,0,

                                    -1,0,0,
                                    -1,0,0,
                                    -1,0,0) //left

    normalArray = normalArray.concat(
                                    0,0,-1,
                                    0,0,-1,
                                    0,0,-1,

                                    0,0,-1,
                                    0,0,-1,
                                    0,0,-1) //back
    

    let cubePositions = new Float32Array(positionArray);
    let cubeTextures = new Float32Array(textureArray);
    let cubeNormals = new Float32Array(normalArray);

    return {
        positionArray,
        textureArray,
        normalArray
    };
    
}