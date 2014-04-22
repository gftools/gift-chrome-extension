$('body').append($("<div/>").attr('id', 'gftools-blockui-message').css('display', 'none'));

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if(message.action == 'ui.block.begin'){
		if(message.text){
			$('div#gftools-blockui-message').text(message.text);
		}
		$.blockUI({
			message: $('div#gftools-blockui-message'),
			css: {
				'border': 'none',
				'padding': '15px',
				'backgroundColor': '#000',
				'-webkit-border-radius': '10px',
				'opacity': '.5',
				'color': '#fff'
			}
		});
	}
	if(message.action == 'ui.block.set'){
		$('div#gftools-blockui-message').text(message.text);
	}
	if(message.action == 'ui.block.end'){
		$.unblockUI();
	}

	//	ユーザIDの取得
	if(message.action == 'background.userId'){
		sendResponse({
			userId: $('#__userId').val()
		});
		return true;
	}

	//	トークンの取得
	if(message.action == 'background.token'){
		console.log('on background.token');
		sendResponse({
			token: $('#__token').val()
		});
		return true;
	}
});
