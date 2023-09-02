// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==


// requirements
if ( !nettools.ui )
{
    alert('nettools/android:ui.js missing !');
}




// namespace
window.nettools = window.nettools || {};
nettools.android = nettools.android || {};



// UI related stuff
nettools.android.ui = (function(){
						   
	// ---- PRIVATE
	
	// status message
	var _notificationWindow = null;
	
	// html5 input types
	var _html5_inputs = ['text', 'tel', 'email', 'number', 'date', 'password', 'color', 'time', 'datetime-local', 'month', 'week'];
	
	
	
	/**
	 * Move form before or after a reference node
	 * 
	 * @param HTMLFormElement form
	 * @param object params Object litteral with dialog form parameters
	 */
	function _positionForm(form, params)
	{
		if ( params['before'] )
			params['before'].parentNode.insertBefore(form, params['before']);
			
		if ( params['after'] )
			if ( params['after'].nextSibling )
				params['after'].parentNode.insertBefore(form, params['after'].nextSibling);
			else
				params['after'].parentNode.appendChild(form);
	}

	
	
	/**
	 * Customize dialog parameters for android UI
	 *
	 * @param object params Dialog parameters (as in nettools.ui.FormBuilder)
	 * @param object androidParams Android-related parameters for dialog
	 */
	function _customizeParams(params, androidParams)
	{
		// always insert a new line after label, and begin a new line for each input
		for ( var f in params.fields )
		{
			params.fields[f].newLineAfterLabel = true;
			params.fields[f].newLineBefore = true;
		}
			
		
		// add events for CANCEL button to hide the form
		var cbcancel = params.cancel;
		params.cancel = function(form)
			{
				if ( typeof cbcancel === 'function' )
					cbcancel(form);					
			
				form.parentNode.removeChild(form); 
			};

		
		
		// if submit handler is everything other than POST, remove form after submit is handled 
		// if this is a POST submit handler, we don't want to remove the form, otherwise the payload is empty !!!
		if ( !(params['submit'] && (params.submit instanceof nettools.jscore.SubmitHandlers.Post)) )
		{
			params.submit = nettools.jscore.SubmitHandlers.Callback.toSubmitHandler(params['submit']).customEvent(
				function(form, elements)
				{
					form.parentNode.removeChild(form);
				});
			
		}

		
		// validation notifier suitable for android UI
		params.notifier = params['notifier'] || function(st)
			{
				// display error on screen top
				nettools.android.ui.notify(st.message, 'ko');
			};
	}
	
	
	
	/**
	 * Customize form for android UI
	 *
	 * @param HTMLFormElement form
	 * @param object params Dialog parameters (as in nettools.ui.FormBuilder)
	 * @param object androidParams Android-related parameters for dialog
	 */
	function _customizeForm(form, params, androidParams)
	{
		function __addCrossButton(input)
		{
			var i = document.createElement('input');
			i.type = 'button';
			i.value = 'X';
			i.onclick = function() { this.previousSibling.value = ""; };
					
			if ( input.nextSibling )
				input.parentNode.insertBefore(i, input.nextSibling);
			else
				input.parentNode.appendChild(i);
		}
		
		

		// for all inputs
		var inputs = form.getElementsByTagName('input');
		var inputsold = [];
		
		
		// make a list of inputs to update ; we don't process them on-the-fly because it will create side effects on the node list (we insert inputs for X buttons !)
		var inputsl = inputs.length;
		for ( var i = 0 ; i < inputsl ; i++ )
			if ( _html5_inputs.indexOf(inputs[i].type) != -1 )
				inputsold.push(inputs[i]);
			
		for ( var i = 0 ; i < inputsold.length ; i++ )
			__addCrossButton(inputsold[i]);
			
			
		// same process for textarea elements
		var inputs = form.getElementsByTagName('textarea');
		var inputsold = [];
		var inputsl = inputs.length;
		for ( var i = 0 ; i < inputsl ; i++ )
			inputsold.push(inputs[i]);
			
		for ( var i = 0 ; i < inputsold.length ; i++ )
			__addCrossButton(inputsold[i]);
        
        
        // CSS
        form.classList.add('uiForm');
	}
	
	
	
	/**
	 * Create a status message notification line (auto-disappear)
	 */
	function _getNotificationWindow()
	{
		if ( _notificationWindow ) 
			return _notificationWindow;
		else
		{
			var w = document.createElement('div');
			w.className = "androidNotificationWindow";
            _notificationWindow = w;
            
            var span = document.createElement('span');
            var a = document.createElement('a');
            a.innerHTML = 'X';
            a.onclick = function(){this.parentNode.parentNode.removeChild(this.parentNode); return false;};
            w.appendChild(span);
            w.appendChild(a);
			
			return w;
		}
	}
	
	// ----- /PRIVATE

	
	return {
		
		/**
         * Prompt
         *
         * @param HTMLElement beforetag Tag before which the prompt form will be inserted
         * @param string lib Prompt text
         * @param string defvalue Default value
         * @param function(string) cb Callback called when user clicks on OK button
         * @param string fieldtype Input field type (text, number, etc.)
         */
		prompt : function(beforetag, lib, defvalue, cb, fieldtype)
		{
            // ne pas utiliser formulaire précédemment créé, qui peut être différent
			nettools.android.ui.editInPlace(
					{
						before : beforetag,
						type : fieldtype,
						label : lib,
						value: defvalue,
						submit : new nettools.jscore.SubmitHandlers.Callback(
							{
								target : function(form, elements)
									{ 
										if ( typeof cb === 'function' ) 
											cb(elements[0].value); 
									} 
							})
					}
				);
		},
		
        
		
		/**
         * Inline edit for 1 input
         *
		 * Params object litteral may define following properties :
		 *   - before : HTMLElement ; if set, the form will be inserted before this element
		 *   - after : HTMLElement ; if set, the form will be inserted after this element
		 *   - label : string ; prompt label
		 *   - value : string ; default value
		 *   - type : string ; input type ('text', 'date', etc.)
		 *   - required : bool ; if set, the input is mandatory
		 *   - regexp : RegExp ; if set, the input will be checked with this regular expression
		 *   - onsubmit : function(string) ; validate data, must return an object litteral { statut:true/false, message:'', field:input_in_error}
		 *   - onsubmitpromise : function(string) ; validate data, must return an Promise resolved with value { statut:true } or rejected with { statut:false, message:'', field:input_in_error}
		 *   - presubmit : function(HTMLInputElement) ; a custom function to make any updates to data before validation and submission (may be used to remove unwanted characters, etc.)
		 *   - submit : nettools.jscore.SubmitHandlers.Handler ; an object responsible for handling form submission
		 *   - cancel : function(HTMLForm) ; a callback called if form is canceled
         *
         * @param Object params Littéral objet décrivant le dialogue
		 */
		editInPlace : function(params)
		{
			// create params specific to nettools.ui.FormBuilder
			var params2 = {	
							fields : {
										editValue:
											{
												type:params['type'] || 'text', 
												value:params['value']?params['value']:'', 
												label:params['label'], 
												required : params['required'] ? ['editValue'] : [],
												regexp : params['regexp'],
												nolabel : params['label'] ? false:true
											}
									},
							presubmit : params['presubmit'] ?
								function(elements)
								{
									params.presubmit(elements.editValue);
								}
								:
								null,
							onsubmit : params['onsubmit'] ?
								function(elements)
								{
									return params.onsubmit(elements.editValue.value);
								}
								:
								null,
                            onsubmitpromise : params['onsubmitpromise'] ?
								function(elements)
								{
									return params.onsubmitpromise(elements.editValue.value);
								}
								:
								null,
							submit : params['submit'],
							cancel : function(form)
									{
										if ( params['cancel'] )
											params.cancel(form);
									}
						};
						
			var androidParams = {
					before : params['before'],
					after: params['after']
				};
						
			
			
			// create form
			var form = nettools.android.ui.editInPlaceForm(params2, androidParams);


			// we get a form with X buttons at the right of the input ; since this is a single line input form, removing that
			form.editValue.parentNode.removeChild(form.editValue.nextSibling);


			// move OK and CANCEL buttons to append them next to the input
			var divb = form.submit_button.parentNode;
			form.editValue.parentNode.appendChild(form.submit_button);
			form.submit_button.value = "OK";
			form.editValue.parentNode.appendChild(form.cancel_button);
			form.cancel_button.value = "<-";

			// removing buttons container
			divb.parentNode.removeChild(divb);

			// place the form
			_positionForm(form, androidParams);
		},
		
        

		/**
         * Inline edit for a form
		 *
		 * `androidParams` object litteral may define following properties :
		 *   - before : HTMLElement ; if set, the form will be inserted before this element
		 *   - after : HTMLElement ; if set, the form will be inserted after this element
		 *
		 * @param object params Object litteral describing form content (see nettools.ui.FormBuilder)
         * @param object androidParams Object litteral with android related parameters
         */
		editInPlaceForm : function(params, androidParams)
		{
			// customize params and create form
			_customizeParams(params, androidParams);
			var form = nettools.ui.FormBuilder.createForm(params);
						
			// place form in DOM tree
			_positionForm(form, androidParams);
			
			// customize form UI
			_customizeForm(form, params, androidParams);
			
			return form;
		},
		
        
		
		
		/**
         * Display error message on the window top 
         *
         * @param string message 
         * @param string statut Message status (ok, ko)
         */
		notify : function(message, statut)
		{
			var w = _getNotificationWindow();
			w.querySelector('span').innerHTML = message;
			w.setAttribute('data-statut', statut || 'ok');
            
            window.scrollTo(0,0);
			
			if ( document.body.hasChildNodes() )
				document.body.insertBefore(w, document.body.childNodes[0]);
			else
				document.body.appendChild(w);
		}        
	};
})();







nettools.android.validator = nettools.android.validator || {

	/**
	/* Form validator suitable for android UI
     *
     * @param object params Validator parameters (see nettools.jscore.validator.FormValidator)
     * @return nettools.jscore.validator.FormValidator
     */
	getAndroidFormValidator : function(params)
	{
		var o = new nettools.jscore.validator.FormValidator(params);
		
		o.setNotifier(
				function _notifier(st)
				{
					nettools.android.ui.notify(st.message, 'ko');
					return st;
				}
			);
			
		return o;
	}
};



