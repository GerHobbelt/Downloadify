/**
 * Downloadify: Client Side File Creation
 * JavaScript + Flash Library
 *
 * @author Douglas C. Neiner <http://code.dougneiner.com/>
 * @version 0.2
 *
 * Copyright (c) 2009 Douglas C. Neiner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

(function () {
  var Downloadify = window.Downloadify = {
    queue: {},
    uid: new Date().getTime(), 
    getTextForSave: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        return obj.getData();
      }
      return "";
    },
    getFileNameForSave: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        return obj.getFilename();
      }
      return "";
    },
    getDataTypeForSave: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        return obj.getDataType();
      }
      return "";
    },
    getTextForCopy: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        return obj.getTextCopy();
      }
      return "";
    },
    saveComplete: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        obj.complete();
      }
      return true;
    },
    saveCancel: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        obj.cancel();
      }
      return true;
    },
    saveError: function ( queue ) {
      var obj = Downloadify.queue[queue];
      if (obj) {
        obj.error();
      }
      return true;
    },
    addToQueue: function ( container ) {
      Downloadify.queue[container.queue_name] = container;
    },
    // Concept adapted from: http://tinyurl.com/yzsyfto
    // SWF object runs off of ID's, so this is the good way to get a unique ID
    getUID: function ( el ) {
      if (el.id === "") {
        el.id = 'downloadify_' + Downloadify.uid++;
      }
      return el.id;
    }
  };

  function extendOptions( options ) {
    var rv = {};
    var opt;

    for (opt in Downloadify.defaultOptions) {
      if (Downloadify.defaultOptions.hasOwnProperty(opt)) {
        rv[opt] = Downloadify.defaultOptions[opt];
      }
    }
    for (opt in options) {
      if (options.hasOwnProperty(opt)) {
        rv[opt] = options[opt];
      }
    }
    return rv;
  } 

  // http://stackoverflow.com/questions/6927637/addeventlistener-in-internet-explorer
  function addEvent( obj, type, fn ) {
    if ( obj.attachEvent ) {
      obj['e' + type + fn] = fn;
      obj[type + fn] = function () {
        obj['e' + type + fn]( window.event );
      };
      obj.attachEvent( 'on' + type, obj[type + fn] );
    } else {
      obj.addEventListener( type, fn, false );
    }
  }

  Downloadify.create = function ( idOrDOM, options ) {
    var el = ( typeof idOrDOM === "string" ? document.getElementById(idOrDOM) : idOrDOM );
    return new Downloadify.Container(el, options);
  };
 
  Downloadify.Container = function ( el, options ) {
    var base = this;

    options = extendOptions( options );

    base.el = el;
    base.enabled = true;
    base.dataCallback = null;
    base.filenameCallback = null;
    base.textcopyCallback = null;
    base.data = null;
    base.filename = null;
 
    var init = function () {
      base.options = options;

      if ( !base.options.append ) {
        // no need to unsubscribe event listeners when we re-use the element again and clear 
        // the A tag which may have been created as a child:
        // http://stackoverflow.com/questions/12528049/if-a-dom-element-is-removed-are-its-listeners-also-removed-from-memory
        base.el.innerHTML = "";
      }

      // enable data uri fallback for supporting browsers: http://caniuse.com/#feat=datauri
      if ( base.options.noFlash || ( el.nodeName.toLowerCase() === "a" && !navigator.userAgent.match( /MSIE/i ) ) ) {
        var a_elem = el;

        // create a suitable A element if the referenced element isn't one
        if ( a_elem.nodeName.toLowerCase() !== "a" ) {
          a_elem = document.createElement('a');
          base.a_elem = a_elem = base.el.appendChild(a_elem);
          
          Downloadify.getUID( a_elem );
        }

        // when a download image has been specified, place that inside the link:
        if ( base.options.downloadImage ) {
          var sprite_style = "background: url(\"" + base.options.downloadImage + "\")";
          if ( base.options.transparent ) {
            sprite_style += " transparent";
          }
          if ( base.options.height ) {
            sprite_style += "; height: " + base.options.height + "px";
          }
          if ( base.options.width ) {
            sprite_style += "; width: " + base.options.width + "px";
          }
          // padding:0 ensures that the sprite/image is properly clipped inside the A element
          a_elem.setAttribute( 'style', sprite_style + "; padding: 0;" );
        }

        // assign an href to the element if not already set
        if ( !a_elem.getAttribute( 'href' ) ) {
          a_elem.setAttribute( 'href', 'javascript:return;' );
        }

        // provide the filename to the fallback
        var fnGetFilename = typeof base.options.filename === 'function'
              ? base.options.filename
              : function () { 
                  return base.options.filename;
                };

        // provide the file data to the fallback
        var fnGetData = typeof base.options.data === 'function'
              ? base.options.data
              : function () { 
                  return base.options.data;
                };

        // fallback mouseover event
        var fnGetDataUri = function() {
          var dataUri = 'data:' + base.options.mimeType;
          var data = fnGetData();
          var filename = fnGetFilename();
          if ( typeof window.btoa  === "function" ) {
            dataUri += ';base64,' + window.btoa( data );
          } else {
            dataUri += ',' + encodeURIComponent( data );
          }
          a_elem.setAttribute( 'download', filename );
          a_elem.setAttribute( 'href', dataUri );
        };

        // attach the fallback: catch both click and doubleclick
        addEvent( a_elem, 'mousedown', fnGetDataUri );
      } else {
        if ( base.options.hidden ) {
          base.options.append = true;
          base.options.downloadImage = null;
          base.options.height = el.offsetHeight;
          base.options.transparent = true;
          base.options.width = el.offsetWidth;
        }

        base.flashContainer = document.createElement('span');
        base.el.appendChild(base.flashContainer);
          
        base.queue_name = Downloadify.getUID( base.flashContainer );
   
        if ( typeof base.options.filename === "function" ) {
           base.filenameCallback = base.options.filename;
        } else if ( base.options.filename ) {
          base.filename = base.options.filename;
        }

        if ( typeof base.options.data  === "function" ) {
          base.dataCallback = base.options.data;
        } else if ( base.options.data ) {
          base.data = base.options.data;
        }
          
        if ( typeof base.options.textcopy  === "function" ) {
          base.textcopyCallback = base.options.textcopy;
        } else if ( base.options.textcopy ) {
          base.textcopy = base.options.textcopy;
        } 
  		
        var flashVars = {
          queue_name: base.queue_name,
          width: base.options.width,
          height: base.options.height,
          hidden: base.options.hidden || false
        };
        
        var params = {
          allowScriptAccess: 'always'
          //menu: false
        };
        
        var attributes = {
          id: base.flashContainer.id,
          name: base.flashContainer.id
        };
        
        if ( base.options.enabled === false ) {
          base.enabled = false;
        }
        
        if ( base.options.transparent === true ) {
          params.wmode = "transparent";
        }
        
        if ( base.options.downloadImage || base.options.hidden ) {
          flashVars.downloadImage = base.options.downloadImage;
        }
        
        swfobject.embedSWF( base.options.swf, base.flashContainer.id, base.options.width, base.options.height, "10", null, flashVars, params, attributes, base.swfObjectCallback );

        Downloadify.addToQueue( base );
      }
    };

    base.enable = function () {
      var swf = document.getElementById(base.flashContainer.id);
      swf.setEnabled(true);
      base.enabled = true;
    };
    
    base.disable = function () {
      var swf = document.getElementById(base.flashContainer.id);
      swf.setEnabled(false);
      base.enabled = false;
    };
 
    base.getData = function () {
      if ( !base.enabled ) {
        return "";
      }
      if ( base.dataCallback ) {
        return base.dataCallback();
      } else if (base.data) {
        return base.data;
      } else {
        return "";
      }
    };
 
    base.getFilename = function () {
      if ( base.filenameCallback ) {
        return base.filenameCallback();
      } else if (base.filename) {
        return base.filename;
      } else {
        return "";
      }
    };
    
    base.getDataType = function () {
      if (base.options.dataType) {
        return base.options.dataType;
      }
      return "string";
    };
	
    base.getTextCopy = function () {
      if ( base.textcopyCallback ) {
        return base.textcopyCallback();
      } else if (base.textcopy) {
        return base.textcopy;
      } else {
        return "";
      }
    };    
	
    base.swfObjectCallback = function( event ) {
      if ( !event.success || !base.options.hidden ) {
        return;
      }
      // set the parent element to use relative positioning
      var parentNode = event.ref.parentNode;
      parentNode.style.position = 'relative';
      // suppress the default click action if the parent node is an anchor tag
      if ( parentNode.nodeName.toLowerCase() == 'a' ) {
        if ( typeof parentNode.addEventListener !== 'undefined' ) {
          parentNode.addEventListener( 'click', function( e ) {
            e.preventDefault();
            return false;
          }, false );
        } else if ( typeof parentNode.attachEvent !== 'undefined' ) {
          // older versions of internet explorer
          parentNode.attachEvent( 'click', function( e ) {
            e.preventDefault();
            return false;
          } );
        }
      }
      // set the flash object to use absolute positioning
      event.ref.style.position = 'absolute';
      event.ref.style.left = 0;
      event.ref.style.top = 0;
      event.ref.style.zIndex = 9999;
    };

    base.complete = function () {
      if ( typeof base.options.onComplete === "function" ) {
        base.options.onComplete();
      }
    };
    
    base.cancel = function () {
      if ( typeof base.options.onCancel === "function" ) {
        base.options.onCancel();
      }
    };
    
    base.error = function () {
      if ( typeof base.options.onError === "function" ) {
        base.options.onError();
      }
    };
  
    init();
  };
  
  Downloadify.defaultOptions = {
    swf: 'media/downloadify.swf',
    downloadImage: 'images/download.png',
    width: 100,
    height: 30,
    hidden: false,
    transparent: true,
    append: false,
    noFlash: false,
    dataType: "string",
    mimeType: "application/octet-stream"     // "text/plain"
  };
})();

// Support for jQuery
if ( typeof jQuery !== "undefined" ) {
  (function( $ ) {
    $.fn.downloadify = function( options ) {
      return this.each( function() {
        var dl = Downloadify.create( this, options );
        $( this ).data( 'Downloadify', dl );
      } );
    };
  })( jQuery );
}

/* mootools helper */
if ( typeof MooTools !== 'undefined' ) {
  Element.implement( {
    downloadify: function( options ) {
      return this.store( 'Downloadify', Downloadify.create( this, options ) );
    }
  } );
}

