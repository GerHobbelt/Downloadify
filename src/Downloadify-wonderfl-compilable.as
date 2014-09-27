/*
  Downloadify: Client Side File Creation
  JavaScript + Flash Library

  Version: 0.2

  Copyright (c) 2009 Douglas C. Neiner

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

package {
  import flash.system.Security;
  import flash.events.Event; 
  import flash.events.MouseEvent;
  import flash.net.FileReference;
  import flash.net.FileFilter;
  import flash.net.URLRequest;
  import flash.display.*;
  import flash.utils.ByteArray;
  import flash.external.ExternalInterface;
  
  import flash.system.Capabilities;
  import flash.system.System;
  import flash.desktop.Clipboard; 
     
  [SWF(backgroundColor="#CCCCCC")]
  [SWF(backgroundAlpha=0)]
  public class Downloadify extends Sprite {
    
    private var options:Object,
                file:FileReference = new FileReference(),
                queue_name:String  = "",
    
                _width:Number      = 0,
                _height:Number     = 0,
                                   
                enabled:Boolean    = true,
                over:Boolean       = false,
                down:Boolean       = false,
                
                buttonImage:String = "images/download.png",
                
                button:Loader;
    
    public function Downloadify() {
      Security.allowDomain('*');
  
      stage.align = StageAlign.TOP_LEFT;
      stage.scaleMode = StageScaleMode.NO_SCALE;
      
      options = this.root.loaderInfo.parameters;
      
      queue_name = options.queue_name.toString();
      
      _width  = options.width;
      _height = options.height;
      
      if(options.downloadImage){
        buttonImage = options.downloadImage;
      }
      
      setupDefaultButton();
      addChild(button);
      
      this.buttonMode = true;
      
      this.addEventListener(MouseEvent.CLICK, onMouseClickEvent);
      this.addEventListener(MouseEvent.ROLL_OVER , onMouseEnter);
      this.addEventListener(MouseEvent.ROLL_OUT , onMouseLeave);
      this.addEventListener(MouseEvent.MOUSE_DOWN , onMouseDown);
      this.addEventListener(MouseEvent.MOUSE_UP , onMouseUp);
      
      ExternalInterface.addCallback('setEnabled', setEnabled);
      
      file.addEventListener(Event.COMPLETE, onSaveComplete);
      file.addEventListener(Event.CANCEL, onSaveCancel);
    }
    
    private function setEnabled(isEnabled:Boolean):Boolean {
      enabled = isEnabled;
      if(enabled === true){
        button.y = 0;
        this.buttonMode = true;
      } else {
        button.y = (-3 * _height);
        this.buttonMode = false;
      }
      return enabled;
    }
    
    private function setupDefaultButton():void {
      button = new Loader();
      var urlReq:URLRequest = new URLRequest(buttonImage);
      button.load(urlReq);
      button.x = 0;
      button.y = 0;
    }
    
    
    
    protected function onMouseEnter(event:Event):void {
      if(enabled === true){
        if(down === false) button.y = (-1 * _height);
        over = true;
      }
    }
    protected function onMouseLeave(event:Event):void {
      if(enabled === true){
        if(down === false) button.y = 0;
        over = false;
      }
    }
    protected function onMouseDown(event:Event):void {
      if(enabled === true){
        button.y = button.y = (-2 * _height);
        down = true;
      }
    }
    protected function onMouseUp(event:Event):void {
      if(enabled === true){
        if(over === false){
          button.y = 0;
        } else {
          button.y = (-1 * _height);
        }
        down = false;
      }
    }
    
    protected function onMouseClickEvent(event:Event):void{
      var theData:String  = ExternalInterface.call('Downloadify.getTextForSave',queue_name),
          filename:String = ExternalInterface.call('Downloadify.getFileNameForSave',queue_name),
          dataType:String = ExternalInterface.call('Downloadify.getDataTypeForSave',queue_name),
          textCopy:String = ExternalInterface.call('Downloadify.getTextForCopy',queue_name);
          
     if (textCopy != "") 
        System.setClipboard(textCopy);     
        
      if (dataType == "string" && theData != "") {
        file.save(theData, filename);
      } else if (dataType == "base64" && theData){
        file.save(Base64.decodeToByteArray(theData), filename);
      } else {
        onSaveError();
      }
    }
    
    protected function onSaveComplete(event:Event):void{
      trace('Save Complete');
      ExternalInterface.call('Downloadify.saveComplete',queue_name);
    }
    
    protected function onSaveCancel(event:Event):void{
      trace('Save Cancel');
      ExternalInterface.call('Downloadify.saveCancel',queue_name);  
    }
    
    protected function onSaveError():void{
      trace('Save Error');
      ExternalInterface.call('Downloadify.saveError',queue_name);  
    }
    
  }
 }

class Base64 {
        import flash.utils.ByteArray
        private static const BASE64_CHARS:String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        public static const version:String = "1.1.0";

        public static function encode(data:String):String {
            // Convert string to ByteArray
            var bytes:ByteArray = new ByteArray();
            bytes.writeUTFBytes(data);
            
            // Return encoded ByteArray
            return encodeByteArray(bytes);
        }
        
        public static function encodeByteArray(data:ByteArray):String {
            // Initialise output
            var output:String = "";
            
            // Create data and output buffers
            var dataBuffer:Array;
            var outputBuffer:Array = new Array(4);
            
            // Rewind ByteArray
            data.position = 0;
            
            // while there are still bytes to be processed
            while (data.bytesAvailable > 0) {
                // Create new data buffer and populate next 3 bytes from data
                dataBuffer = new Array();
                for (var i:uint = 0; i < 3 && data.bytesAvailable > 0; i++) {
                    dataBuffer[i] = data.readUnsignedByte();
                }
                
                // Convert to data buffer Base64 character positions and 
                // store in output buffer
                outputBuffer[0] = (dataBuffer[0] & 0xfc) >> 2;
                outputBuffer[1] = ((dataBuffer[0] & 0x03) << 4) | ((dataBuffer[1]) >> 4);
                outputBuffer[2] = ((dataBuffer[1] & 0x0f) << 2) | ((dataBuffer[2]) >> 6);
                outputBuffer[3] = dataBuffer[2] & 0x3f;
                
                // If data buffer was short (i.e not 3 characters) then set
                // end character indexes in data buffer to index of '=' symbol.
                // This is necessary because Base64 data is always a multiple of
                // 4 bytes and is basses with '=' symbols.
                for (var j:uint = dataBuffer.length; j < 3; j++) {
                    outputBuffer[j + 1] = 64;
                }
                
                // Loop through output buffer and add Base64 characters to 
                // encoded data string for each character.
                for (var k:uint = 0; k < outputBuffer.length; k++) {
                    output += BASE64_CHARS.charAt(outputBuffer[k]);
                }
            }
            
            // Return encoded data
            return output;
        }
        
        public static function decode(data:String):String {
            // Decode data to ByteArray
            var bytes:ByteArray = decodeToByteArray(data);
            
            // Convert to string and return
            return bytes.readUTFBytes(bytes.length);
        }
        
        public static function decodeToByteArray(data:String):ByteArray {
            // Initialise output ByteArray for decoded data
            var output:ByteArray = new ByteArray();
            
            // Create data and output buffers
            var dataBuffer:Array = new Array(4);
            var outputBuffer:Array = new Array(3);

            // While there are data bytes left to be processed
            for (var i:uint = 0; i < data.length; i += 4) {
                // Populate data buffer with position of Base64 characters for
                // next 4 bytes from encoded data
                for (var j:uint = 0; j < 4 && i + j < data.length; j++) {
                    dataBuffer[j] = BASE64_CHARS.indexOf(data.charAt(i + j));
                }
                  
                  // Decode data buffer back into bytes
                outputBuffer[0] = (dataBuffer[0] << 2) + ((dataBuffer[1] & 0x30) >> 4);
                outputBuffer[1] = ((dataBuffer[1] & 0x0f) << 4) + ((dataBuffer[2] & 0x3c) >> 2);        
                outputBuffer[2] = ((dataBuffer[2] & 0x03) << 6) + dataBuffer[3];
                
                // Add all non-padded bytes in output buffer to decoded data
                for (var k:uint = 0; k < outputBuffer.length; k++) {
                    if (dataBuffer[k+1] == 64) break;
                    output.writeByte(outputBuffer[k]);
                }
            }
            
            // Rewind decoded data ByteArray
            output.position = 0;
            
            // Return decoded data
            return output;
        }
        
        public function Base64() {
            throw new Error("Base64 class is static container only");
        }
    }
    
    
