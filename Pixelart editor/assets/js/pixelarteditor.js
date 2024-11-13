/** TODO
 * Boton de descargar desplegable
 * Tamaño del canvas
 * Cambiar el color de fondo?
 * Paleta
 */

const RESOLUTION = 32;
const BACKGROUND_COLOR = "#f5e19c";

$(document).ready(function() {
    let canvas = document.getElementById("mpae-pixelart-canvas");
    canvas.setAttribute('width', RESOLUTION);
    canvas.setAttribute('height', RESOLUTION);
    let draw = canvas.getContext("2d");
    // Get canvas real size
    let canvasSize = canvas.getBoundingClientRect();
    let pixelSize = canvasSize.width / RESOLUTION;
    // Other variables
    let selectedColor = $('#mpae-color-picker').val();
    $('#mpae-color-picker-btn').css('background-color', selectedColor);
    let selectedTool = 'pen';
    let selectedSize = 1;
    let lastPixelX, lastPixelY;


    // Background
    draw.fillStyle = BACKGROUND_COLOR;
    draw.fillRect(0, 0, RESOLUTION, RESOLUTION);

    // Download buttons
    $('#mpae-download-btn::after').css('content', '<a id="mpae-download-link" download="pixelart">Download Original</a>');
    saveImage();

    // Canvas events
    $('#mpae-pixelart-canvas')
    .mousedown(function() { 
        lastPixelX = null;
        lastPixelY = null; 
    })
    .mouseout(function()  { 
        lastPixelX = null;
        lastPixelY = null; 
    })
    .mousemove(function(e) {
        // Si el boton izq está presionado
        if(e.buttons == 1) clickCanvas(e);
    })
    .click(function(e){ clickCanvas(e) });

    // Manages the click events in the canvas
    function clickCanvas(e) {
        // Get the mouse coordinates inside the canvas
        let canvasSize = canvas.getBoundingClientRect();
        let mouseX = e.clientX - canvasSize.left,
        mouseY = e.clientY - canvasSize.top;

        // Get clicked pixel's coordinates
        let pixelX = Math.floor(mouseX / pixelSize);
        let pixelY = Math.floor(mouseY / pixelSize);

        switch(selectedTool){
            case 'pen':
            case 'eraser':
                if (lastPixelX != null && lastPixelY != null) {
                    // Dibujar una línea de píxeles desde el último punto hasta el actual
                    drawLine(lastPixelX, lastPixelY, pixelX, pixelY);
                } else {
                    // Dibujar un solo píxel
                    drawPixel(pixelX, pixelY);
                }
                break;
            case 'pickcolor':
                pickColor(pixelX, pixelY);
                break;
            case 'bucket':
                bucket(pixelX, pixelY);
                break;
        }
        
        // Guardar las coordenadas actuales para la próxima vez
        lastPixelX = pixelX;
        lastPixelY = pixelY;

        saveImage();
    }

    // Draws a pixel on the canvas
    function drawPixel(pixelX, pixelY) {
        draw.fillStyle = (selectedTool == 'eraser')? BACKGROUND_COLOR : selectedColor;
        draw.fillRect(pixelX, pixelY, 1, 1);

        if(selectedTool != 'pen' && selectedTool != 'eraser') return;

        // Pen Sizes
        if(selectedSize > 1){
            draw.fillRect(pixelX-1, pixelY, 3, 1);
            draw.fillRect(pixelX, pixelY-1, 1, 3);
        } 
        if(selectedSize == 3){
            draw.fillRect(pixelX-1, pixelY-2, 3, 1);
            draw.fillRect(pixelX-2, pixelY-1, 5, 3);
            draw.fillRect(pixelX-1, pixelY+2, 3, 1);
        }
    }

    // Dibuja una línea entre dos puntos sin antialiasing, utilizando el algoritmo de Bresenham
    function drawLine(x0, y0, x1, y1) {
        let distanciaX = Math.abs(x1 - x0),
            distanciaY = Math.abs(y1 - y0),
            signoX     = (x0 < x1) ? 1 : -1,
            signoY     = (y0 < y1) ? 1 : -1,
            // err es la acumulacion de error (si por cada 1 x debemos sumar 0.5y, va a no moverse en la y y sumar 0.5 al error, hasta que el error sea 1 o mas)
            error = distanciaX - distanciaY;
    
        while (true) {
            drawPixel(x0, y0); // Dibujar el píxel en la posición actual
    
            // Hemos terminado la linea
            if (x0 === x1 && y0 === y1) break;
            // Valor intermedio??
            let valorIntermedio = 2 * error;
            if (valorIntermedio > -distanciaY) { // Si el valor intermedio no llega a la y que necesitamos
                // Si NO nos tenemos que mover en y, nos movemos en x
                error -= distanciaY; // Como no hemos avanzado en la y, en el siguiente pixel necesitamos avanzar en la y el doble
                x0    += signoX;
            }
            if (valorIntermedio < distanciaX) {
                error += distanciaX;
                y0    += signoY;
            }
        }
    }

    // Asigns the clicked pixel's color to the selected color
    function pickColor(pixelX, pixelY) {
        let pixel = draw.getImageData(pixelX, pixelY, 1, 1).data;
        selectedColor = rgbToHex(pixel);
        $('#mpae-color-picker').val(selectedColor);
        $('.mpae-tool-btn[value=pen]').click();
        $('#mpae-color-picker-btn').css('background-color', selectedColor);
    }

    // Save to the png image, update preview and download link
    function saveImage() {
        // Guardar original
        let img = canvas.toDataURL('image/png');
        $('#mpae-preview').attr('src', img);
        $('#mpae-download-link').attr('href', img);

        // Guardar reescalada
        const tempCanvas  = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width  = 1024;
        tempCanvas.height = 1024;
        tempContext.imageSmoothingEnabled = false;

        tempContext.drawImage(
            canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, tempCanvas.width, tempCanvas.height
        );

        const imgScaled = tempCanvas.toDataURL('image/png');
        $('#mpae-download-scaled-link').attr('href', imgScaled);
    }

    // Fills an area with the main color
    function bucket(pixelX, pixelY, targetColor = null) {
        // Obtenemos el color que hemos clickado si no nos viene por parametro
        if(targetColor == null){
            let pixel = draw.getImageData(pixelX, pixelY, 1, 1).data;
            targetColor = rgbToHex(pixel);
        }
        
        // Verificamos que el píxel esté dentro del canvas
        if (pixelX < 0 || pixelX >= RESOLUTION || pixelY < 0 || pixelY >= RESOLUTION) return;

        // Si el color actual no coincide con el targetColor, salimos
        let currentPixel = draw.getImageData(pixelX, pixelY, 1, 1).data;
        let currentColor = rgbToHex(currentPixel);
        if (currentColor !== targetColor || currentColor == selectedColor) return;
            
        // Dibujamos el pixel actual
        drawPixel(pixelX, pixelY);

        // Comparamos el color de los pixeles anexos con el targetColor
        let directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
        ];
        for(let d = 0; d < directions.length; d++){
            bucket(pixelX + directions[d][0], pixelY + directions[d][1], targetColor);
        }
    }

    // Buttons events
    $(".mpae-tool-btn").click(function() {
        $(".mpae-tool-btn").removeClass('selected');
        $(this).addClass('selected');
        selectedTool = $(this).val();
    });
    $(".mpae-size-btn").click(function() {
        $(".mpae-size-btn").removeClass('selected');
        $(this).addClass('selected');
        selectedSize = parseInt($(this).val().replace('size', ''));
        // If the selected tool is not pen or eraser, change to pen
        if(selectedTool != 'pen' && selectedTool != 'eraser')
            $('.mpae-tool-btn[value=pen]').click();
    });
    $("#mpae-color-picker").change(function(){ 
        selectedColor = $(this).val(); 
        $('.mpae-tool-btn[value=pen]').click();
        $('#mpae-color-picker-btn').css('background-color', selectedColor);
    });
    $("#mpae-color-picker-btn").click(function(){ 
        $('#mpae-color-picker').click()
    });

    // Returns a string with the hex values of the color
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(color) {
        return '#' + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
    }
});

