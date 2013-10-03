/* ------------------------------------------------------------------------

    Ok if you get here you are interested in code.
I'm sorry if you find the code dirty and messy and full of Italianisms. :(
I swear, I try to write things clean, but that's what comes out of the hat.


Any changes / patches / bug / request is extremely accepted. 
Please let me see how much sugar we can add to our candy. (We're gluttons for sweets)

The code can be found here https://github.com/serpica/oknit.me


If you really do not know where to start I'll give you a hint: 
the image after being charged, it is stretched to match it to a canvas of the right size. 
With the help of fairy Color Tief (https://github.com/lokesh/color-thief not thank you enough <3), 
is carried in 2 colors (black and white) simply looking for the nearest color 
with a weighted Euclidean distance (after distribution of the alpha channel on the other three components)
At this point is created a list of the positions of "pixels" blacks, is loaded the svg 
corresponding to the grid size (48x24 or 60x24) and is set (scrolling the svg tree) the corresponding node 
(setting the "on" class).
At the end are deleted nodes not set previously, and the svg file is ready to be downloaded.

Last edit: Oct 3 2013 from Autoscatto







            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.



--------------------------------------------------------------------------*/

function cloneObject(source) {
    for (i in source) {
        if (typeof source[i] == 'source') {
            this[i] = new cloneObject(source[i]);
        }
        else{
            this[i] = source[i];
	}
    }
}


function rotate90(cx,cy,x,y){
    var rx=-(y-cy)+cx;
    var ry=(x-cx)+cy;
    return {x:rx,y:ry}
}





var Knitme = (function(){
    var EDITABLE=false,
        canv_name="canveditor",
        grid_name="griglia",
        tmpcanv_name="tmpcanvas",
        previwe_name="#preview",
        tmpimg_name="",
        wsize = 24,
        rhsize = 60,
        pallini={},
        canvas = document.getElementById(canv_name),
        griglia = document.getElementById(grid_name),
        tmpcanv = document.getElementById(tmpcanv_name),
        ctx = canvas.getContext('2d'),
        gtx = griglia.getContext('2d'),
        ttx = tmpcanv.getContext('2d'),
        RAGGIO=4,
        MAGNIF=10,
        W=wsize * 10 + 10,
        H=rhsize * 10 + 10,
        maxcol = 255,
        OFFSET={x:0,y:0},
	    imgi={w:0,h:0,cx:0,cy:0}

        $id = function (id) {return document.getElementById(id);},
        Output = function (msg) { var m = $id("messages");  m.innerHTML = msg + m.innerHTML;},
        FileDragHover= function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.target.className = (e.type == "dragover" ? "hover" : "");
        },
        FileSelectHandler = function (e){
            // cancel event and hover styling
            FileDragHover(e);
            // fetch FileList object
            var files = e.target.files || e.dataTransfer.files;
            // process all File objects
            for (var i = 0; i < files.length; i++) {
                ParseFile(files[i]);
            }

        },



        SetupDim = function(){ //the canvas is stretched to a magnified size (in order to draw grid, squares, ... at human dimension)
            rhsize=parseFloat($('input[name=optionsRadios]:checked').val());
            H=rhsize * 10 + 10;
            ctx.canvas.height=rhsize*10;
            gtx.canvas.height=rhsize*10;
            ttx.canvas.height=rhsize*10;
            if(hsize>rhsize) hsize = rhsize;
            tmpcanv.width = wsize;
            tmpcanv.height = hsize;
            img=document.getElementById('upimage');
            ttx.drawImage(img, 0, 0, wsize, hsize);
            document.getElementById('svgframe').src = rhsize+"-raws.svg";

        }


        ParseFile = function(file) { //The file is loaded and stucked on a "small" canvas
            Output("<p>File information: <strong>" + file.name +"</strong> type: <strong>" + file.type +"</strong> size: <strong>" + file.size +"</strong> bytes</p>");
            $("#uploadform").hide();
            $("#uploadcontrol").show();
            var img = document.createElement("img");
            img.id="upimage"
            img.onload = function(){
                wpercent = wsize/img.width;
                hsize=Math.floor(img.height * wpercent);
		        imgi.w=img.width;
		        imgi.h=img.height;
		        imgi.cx=Math.floor((imgi.w/2)* wpercent);
		        imgi.cy=Math.floor((imgi.h/2)* wpercent);		

            };

        var reader = new FileReader();        
        reader.onloadend = function() {img.src = reader.result;};
        reader.readAsDataURL(file);
        $(previwe_name).after(img);
	    $(img).css({height:400})
	    $(previwe_name).show();
        },




        setupgriglia = function(cont){ //draw the grid on the canvas

            //faccio la girglia (il cerchio occupa r + 2 * lineborder)

            for(i=0; i<W; i=i+MAGNIF){
              if(((i / MAGNIF) % 2 === 0)&& i>0){  cont.fillStyle="#333333"; cont.font = "bold 8px sans-serif"; cont.fillText(i/10+"",i-8,H); }
              cont.beginPath();
              cont.strokeStyle="#cccccc";
              cont.moveTo(i, 0);
              cont.lineTo(i, H);
              cont.stroke();
            }   
            for(i=0; i<H; i=i+MAGNIF){
              if((i/MAGNIF)%2===0){    cont.fillStyle="#333333"; cont.font = "bold 8px sans-serif"; cont.fillText(i/10+"", W-4, i-2); }
              cont.beginPath();
              cont.strokeStyle="#cccccc";
              cont.moveTo(0, i);
              cont.lineTo(W+10, i);
              cont.stroke();
            }   


        },
	refresha=function(){ //does the refresh of the canvas (possibly with the offset set by the editor)
		//XXX: vedere se si puo' far meglio!!! (copio l'array solo per aggiornare lo stato con offset
		var pallini2= new cloneObject(pallini);
		pallini={};
		for (var k in pallini2){	
		     	coord = k.split('.');
		        ncoord=[~~coord[0]+OFFSET.x,~~coord[1]+OFFSET.y];
			newk=ncoord[0]+"."+ncoord[1];
			pallini[newk]=pallini2[k];		
		}
		OFFSET.x=0;
		OFFSET.y=0;
		drawpallini(true);
	
	},
        getpallini= function(){ return pallini; },
        drawpallini = function(bolo){// draws the squares relative to the punches
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(griglia, 0, 0);
            for (var k in pallini){
                if(pallini[k]){
                    coord = k.split('.');
                    if(~~coord[0]>=0 && ~~coord[1]>=0 && ~~coord[0]<=wsize-1 && ~~coord[1]<=rhsize-1 ){
                    ctx.beginPath();
                	if(bolo) cstyle="#008080"; else cstyle="#46ba59";
					ctx.strokeStyle=cstyle;
                    //XXX: offset di un pixel solo per effetto grafico (e' piu' bellino dentro i bordi)
                	//ctx.arc(~~coord[0]*MAGNIF+RAGGIO+1+OFFSET.x*MAGNIF,~~coord[1]*MAGNIF+RAGGIO+1+OFFSET.y*MAGNIF,RAGGIO,0, 2*Math.PI);
			//ctx.arc(~~coord[0]*MAGNIF+RAGGIO+1,~~coord[1]*MAGNIF+RAGGIO+1,RAGGIO,0, 2*Math.PI);
            recx=~~coord[0]*MAGNIF;
            recy=~~coord[1]*MAGNIF;
            ctx.rect(recx, recy, RAGGIO*2, RAGGIO*2);

                	//
			ctx.fillStyle=cstyle;
      			ctx.fill();
                	ctx.stroke(); }
                }

            }

        },


        togglapallino = function(griglia, ctx, xp, yp){ //changes the state of the squares between editable or not
            key = xp+"."+yp;
            if(pallini[key]===undefined) pallini[key]=false;
            pallini[key] = !pallini[key];
            drawpallini(EDITABLE);
        },

        /*  functions that move across the field of squares (rotations, shifting, flip ..) */

        mv_up= function(){
            OFFSET.y=-1;            
        },
        mv_down= function(){
            OFFSET.y=1;            
        },
        mv_left= function(){
            OFFSET.x=-1;            
        },
        mv_right= function(){
            OFFSET.x=1;            
        },
	    rotate=function(){ 		
		    var pallini2= new cloneObject(pallini);
		    pallini={};
		    for (var k in pallini2){	
		         	coord = k.split('.');
		            ncoord=rotate90(imgi.cx,imgi.cy,coord[0],coord[1])
			    newk=ncoord.x+"."+ncoord.y;
			    pallini[newk]=pallini2[k];		
		    }
		    drawpallini(true);

	    },
	    flipx=function(){ 		
		    var pallini2= new cloneObject(pallini);
		    pallini={};
		    for (var k in pallini2){	
		         	coord = k.split('.');
			    newk=(-coord[0]+2*imgi.cx)+"."+coord[1];
			    pallini[newk]=pallini2[k];		
		    }
		    drawpallini(true);

	    },
	    flipy=function(){ 		
		    var pallini2= new cloneObject(pallini);
		    pallini={};
		    for (var k in pallini2){	
		         	coord = k.split('.');
			    newk=coord[0]+"."+(-coord[1]+2*imgi.cy);
			    pallini[newk]=pallini2[k];		
		    }
		    drawpallini(true);

	    },

         /* ------------------------------------------- */


        getPosition= function(event){ //changes the state of the square when it is clicked with the mouse while editing
                    if(EDITABLE){
                        var rect = canvas.getBoundingClientRect();
                        var x= event.clientX - rect.left;
                        var y= event.clientY - rect.top;
                        x=Math.floor(x/MAGNIF)-1-OFFSET.x;
                        y=Math.floor(y/MAGNIF)-1-OFFSET.y;
                        if((x<wsize+1) && (y<rhsize+1)) togglapallino(griglia, ctx, x, y);}
                    },



        toggledit= function(bolo){
                if(bolo) {
                        EDITABLE=true;
                        drawpallini(EDITABLE);
                    } else {
                        EDITABLE=false;
                        drawpallini(EDITABLE);
                    }
        },



        initeditcanv = function(){ //initializes the canvas (grid, mouse events management, draw of squares)
            setupgriglia(gtx);
            canvas.addEventListener("mousedown", getPosition, false);
            drawpallini(false);

        },


        domgc = function(){
        /*
                        Salagadoola mechicka boola bibbidi-bobbidi-boo
                            Put 'em together and what have you got
                                     bibbidi-bobbidi-boo
                        Salagadoola mechicka boola bibbidi-bobbidi-boo
                               It'll do magic believe it or not
                                    bibbidi-bobbidi-boo
                             Salagadoola means mechicka booleroo
                           But the thingmabob that does the job is
                                    bibbidi-bobbidi-boo
                        Salagadoola menchicka boola bibbidi-bobbidi-boo
                            Put 'em together and what have you got
                        bibbidi-bobbidi bibbidi-bobbidi bibbidi-bobbidi-boo
        */

                var choosecolor = function(pr, pg, pb, mr, mb, mg){ 
                        dnero=Math.ceil(Math.sqrt((mr-pr)*(mr-pr) + (mg-pg)*(mg-pg) + (mb-pb)*(mb-pb)));
                        dbian=Math.ceil(Math.sqrt((maxcol-pr)*(maxcol-pr) + (maxcol-pg)*(maxcol-pg) + (maxcol-pb)*(maxcol-pb)));
                        if(dbian<=dnero) return [maxcol, maxcol, maxcol];
                        else return [0, 0, 0];
                    };

                function pallinator(p){
                    r = p[0];
                    g = p[1];
                    b = p[2];
                    db=(0-r)*(0-r)+(0-g)*(0-g)+(0-b)*(0-b);
                    dw=(maxcol-r)*(maxcol-r)+(maxcol-g)*(maxcol-g)+(maxcol-b)*(maxcol-b);
                    return (db<dw);
                }

                function distalpha(c, a){return Math.ceil(c*(a/maxcol)+maxcol*(1-a/maxcol));}

                var map = ttx.getImageData(0, 0, wsize, tmpcanv.height);
                var imdata = map.data;
                var grupped=[];
                for(var p = 0, len = imdata.length; p < len; p+=4) {    
                    imdata[p]    =distalpha(imdata[p],imdata[p + 3]);
                    imdata[p + 1]=distalpha(imdata[p + 1],imdata[p + 3]);
                    imdata[p + 2]=distalpha(imdata[p + 2],imdata[p + 3]);
                    imdata[p + 3]=maxcol;
                    grupped.push([imdata[p],imdata[p + 1],imdata[p + 2]]); }

                ttx.putImageData(map, 0, 0);
                var maxColors = 2;
                pallini={}; 
                var cmap = MMCQ.quantize(grupped, maxColors);
                var newPalette = cmap.palette();
                var newPixels = grupped.map(function(p) {    return cmap.map(p); });
                for(p = 0; p<newPixels.length; p+=1){
                    x = p%wsize;
                    y=Math.floor(p/wsize);
                    var reso = pallinator(newPixels[p]);
                    if(reso) pallini[x+"."+y]=reso;
                }
                initeditcanv();
                
                    
        },

        toSvg = function(){ //passes from abstraction of squares (a js dictionary with the coordinates as a key) to final svg file
	    /*

               svg grid numbered like: 
                ---------------------------------
                | (wsize-1) () () .....     (0) |
                | (wsize-1+wsize) ..... (wsize) |
                | ............................. |
                | ............................. |
                | ............................. |
                | (wsize*rhsize -1) ............|
                ---------------------------------


        */
            for (var k in pallini){
                if(pallini[k]){
                    coord = k.split('.');
 		        if(~~coord[0]>=0 && ~~coord[1]>=0 && ~~coord[0]<=wsize-1 && ~~coord[1]<=rhsize-1 ){
                    ncoord=[~~coord[0],~~coord[1]];
                    $('#svgframe').contents().find("#pallino"+(((ncoord[1])*wsize)+wsize-1-ncoord[0])).attr( { class: "on prev" } );
		   }
           }
        }

        },


        downloadSvg = function downloadsvg(){
            $('#svgframe').contents().find('[class="off"]').remove(); //removing off node
            $('#svgframe').contents().find('[class="on prev"]').attr("class","on") //remove preview stroke-width
 
            var svg = $('<div>').append($('#svgframe').contents().find('svg').clone()).html();
            var blob = new Blob([svg], {type: "image/svg+xml"});

            saveAs(blob, "knitme.svg");
            $('[data-provide="option-cancelsvg"]').on('click', function() { location.reload();  });
            $("#dlink").append($("<a href='data:image/svg+xml,\n"+svg+"' title='knitme.svg'>[direct link to svg]</a>"));


        },

/*
        coming soon features!!!!!1ONE!!ONE
*/
        setuppatternview=function(){
              pppallini = function(ox,oy){
                  for (var k in pallini){
                    if(pallini[k]){
                        coord = k.split('.');
                        if(~~coord[0]>=0 && ~~coord[1]>=0 && ~~coord[0]<=23 && ~~coord[1]<=23 ){
                        ppcont.beginPath();
                    	cstyle="#46ba59";
	                    ppcont.strokeStyle=cstyle;
                        recx=~~coord[0]*2;
                        recy=~~coord[1]*2;
                        ppcont.rect(recx+ox, recy+oy, 2, 2);

                        ppcont.fillStyle=cstyle;
	                    ppcont.fill();
                    	ppcont.stroke(); }
                    }

                }

              };

              ppc = document.getElementById('patternpreview');
              ppcont = ppc.getContext('2d');
              ppcont.canvas.height=rhsize*6+4;
              D=wsize*2;
              DL=rhsize*2;
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(D, 0);
              ppcont.lineTo(D*2, 0);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(0, DL);
              ppcont.lineTo(D*3, DL);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(0, DL*2);
              ppcont.lineTo(D*3, DL*2);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(D, DL*3);
              ppcont.lineTo(D*2, DL*3);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(0, DL);
              ppcont.lineTo(0, DL*2);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(D, 0);
              ppcont.lineTo(D, DL*3);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(D*2, 0);
              ppcont.lineTo(D*2, DL*3);
              ppcont.stroke();
              //
              ppcont.beginPath();
              ppcont.strokeStyle="#cccccc";
              ppcont.moveTo(D*3, DL);
              ppcont.lineTo(D*3, DL*2);
              ppcont.stroke();
              
              pppallini(D,0);
              pppallini(0,DL);
              pppallini(D,DL);
              pppallini(D*2,DL);
              pppallini(D,DL*2);

        },

        batman = function(){                    // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        $(".bg").hide();                        // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        $(".navbar").hide();                    // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        $("#canveditor").show();                // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        $("#upload").hide();                    // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        $("#canvicont").show();                 // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
            pallini={}                          // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
            for (nanana in Batman) {pallini[Batman[nanana]]=true;}// NA NA NA NA BATMAN!
            drawpallini();                      // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
            $("footer").html('<object width="960" height="720"><param name="movie" value="//www.youtube.com/v/q0t015ITG6E?version=3&amp;autoplay=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="//www.youtube.com/v/q0t015ITG6E?version=3&amp;autoplay=1" type="application/x-shockwave-flash" width="960" height="720" allowscriptaccess="always" allowfullscreen="true"></embed></object>');                              // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
                                                // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
                                                // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        },                                      // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
                                                // NA NA NA NA NA﻿ NA NA NA NA NA BATMAN!
        init = function() {

        
        var fileselect = $id("fileselect"),
             filedrag = $id("filedrag"),
             submitbutton = $id("btnsubmit");

        // file select
        fileselect.addEventListener("change", FileSelectHandler, false);

        // is XHR2 available?
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {

            // file drop
            filedrag.addEventListener("dragover", FileDragHover, false);
            filedrag.addEventListener("dragleave", FileDragHover, false);
            filedrag.addEventListener("drop", FileSelectHandler, false);
            filedrag.style.display = "block";
        }

        };
  


    return {
        init: init,
        getpallini: getpallini,
        pattern: setuppatternview,
        setupdim: SetupDim,
        dothemagic: domgc,
        tosvg: toSvg,
        toggleedit: toggledit,
        download: downloadSvg,
        up: mv_up,
        down: mv_down,
        left: mv_left,
        right: mv_right,
        refresh: refresha,
	    rotate90: rotate,
        nanananananana: batman,
	    flipw: flipx,
	    fliph: flipy


    };
})();
