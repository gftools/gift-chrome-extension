$(function(){
	if(!window.localStorage.getItem('expr')){
		window.localStorage.setItem('expr', JSON.stringify({
			material:0,
			rarities:['1','2','3','4','5','6'],
			sorts:[],
			spheres:['1','2','3'],
			name: '',
			event: '',
			cost_min: '',
			cost_max: ''
		}));
	}

	var worker = new Worker('worker.js');

	$('#dialog').dialog({
		autoOpen: false,
		buttons: {
			'閉じる': function(){
				$(this).dialog('close');
			}
	    }
	});
	/**
		イベントリストの取得
	*/
	chrome.runtime.sendMessage({action: 'ui.events'}, function(data){
		if(data.rows){
			$('#events').empty();
			for(var i = 0; i < data.rows.length; i ++){
				$('#events').append($('<option>').attr({'value' : data.rows[i].event}).text(data.rows[i].event));
			}
		}
	});
	/**
		データ表示用
	*/
	$('#table1').jqGrid({
		datatype: 'local',
		colNames:['ID','ギフトID', '属性', '名前', 'レ', 'コ', '攻', '守', '援', '日付','説明', '素材'],
		colModel:[
			{
				name: 'id',
				index: 'id',
				width: 40,
				key: true,
				formatter: 'int',
				sorttype: 'int'
			},
			{
				name: 'giftId',
				index: 'giftId',
				width: 60,
				hidden: true
			},
			{
				name:'sphereId',
				index:'sphereId',
				width:50,
				formatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 1:
							return 'COOL';
						case 2:
							return 'SWEET';
						case 3:
							return 'POP';
						default:
							return '-';
					}
				},
				unformatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 'COOL':
							return 1;
						case 'SWEET':
							return 2;
						case 'POP':
							return 3;
						default:
							return 0;
					}
				}
			},
			{
				name:'name',
				index:'name',
				width:180
			},
			{
				name:'rarity',
				index:'rarity',
				width:20,
				align:'center',
				formatter: function(cellValue, options, cellObject){
					switch(cellValue){
						case 1:
							return 'N';
						case 2:
							return 'HN';
						case 3:
							return 'R';
						case 4:
							return 'HR';
						case 5:
							return 'SR';
						case 6:
							return 'SSR';
						case 7:
							return 'UR';
						default:
							return '-';
					}
				},
				unformatter: function(cellValue, options, cellObject){
					switch(cellValue){
						case 'N':
							return 1;
						case 'HN':
							return 2;
						case 'R':
							return 3;
						case 'HR':
							return 4;
						case 'SR':
							return 5;
						case 'SSR':
							return 6;
						case 'UR':
							return 7;
						default:
							return 0;
					}
				}
			},
			{
				name:'cost',
				index:'cost',
				width: 20,
				align:'center',
				formatter: 'int',
				sorttype: 'int',
				formatter: function(cellValue, options, cellObject){
					return cellValue ? cellValue : 0;
				},
				unformatter: function(cellValue, options, cellObject){
					return cellValue
				}
			},
			{
				name:'attack',
				index:'attack',
				width: 30,
				align:'center',
				formatter: 'int',
				sorttype: 'int',
				formatter: function(cellValue, options, cellObject){
					return cellValue ? cellValue : 0;
				},
				unformatter: function(cellValue, options, cellObject){
					return cellValue
				}
			},
			{
				name:'defence',
				index:'defence',
				width: 30,
				align:'center',
				formatter: 'int',
				sorttype: 'int',
				formatter: function(cellValue, options, cellObject){
					return cellValue ? cellValue : 0;
				},
				unformatter: function(cellValue, options, cellObject){
					return cellValue
				}
			},
			{
				name:'yell',
				index:'yell',
				width: 80
			},
			{
				name:'date',
				index:'date',
				width: 40,
				align:'center'
			},
			{
				name:'description',
				index:'description',
				width:200,
				sortable:false
			},
			{
				name:'is_material',
				index:'is_material',
				width:20,
				hidden: true
			}
		],
        sortname: 'id',
        sortorder: 'DESC',
		scroll: 1,
		multiselect: true,
		multikey: 'ctrlKey',
		caption: "GF Gift",
		pager: $('#pager1'),
		shrinkToFit : true,
		height: 480,
		afterInsertRow: function(rowid, rowData){
			console.log(rowid);
			var rowElement = $('#' + rowid, $(this));
			switch(parseInt(rowData.sphereId)){
				case 1:
					rowElement.addClass('cool');
					break;
				case 2:
					rowElement.addClass('sweet');
					break;
				case 3:
					rowElement.addClass('pop');
					break;
			}
		}
	}).navGrid('#pager1', {
		edit: false,
		add: false,
		del: false,
		refresh: false,
		search: false
	},{},{},{},{
		multipleSearch: true,
		closeAfterSearch: true
	}).hideCol('cb').navButtonAdd('#pager1', {
		'caption'       : '',
		'title'         : '検索',
		'buttonicon'    : 'ui-icon-search',
		'position'      : 'last',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			$('#dialog').dialog('open');
		}
	}).navButtonAdd('#pager1', {
		'caption'       : '',
		'title'         : '受取',
		'buttonicon'    : 'ui-icon-check',
		'position'      : 'last',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			var ids = $(this).getGridParam("selarrrow");
			var giftIds = [];
			for(var i = 0; i < ids.length; i ++){
				var record = $(this).getRowData(ids[i]);
				giftIds.push(record.giftId);
			}
			chrome.runtime.sendMessage({action: 'ui.receive', ids: giftIds});
			window.close();
		}
	}).navButtonAdd('#pager1', {
		'caption'       : '',
		'title'         : '差分',
		'buttonicon'    : 'ui-icon-refresh',
		'position'      : 'last',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			window.close();
			chrome.runtime.sendMessage({action: 'ui.diff'});
		}
	}).navButtonAdd('#pager1', {
		'caption'       : '',
		'title'         : '同期',
		'buttonicon'    : 'ui-icon-refresh',
		'position'      : 'last',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			window.close();
			chrome.runtime.sendMessage({action: 'ui.sync'}, function(data){
			});
		}
	}).navButtonAdd('#pager1', {
		'caption'       : '',
		'title'         : 'wiki',
		'buttonicon'    : 'ui-icon-refresh',
		'position'      : 'last',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			window.close();
			chrome.runtime.sendMessage({action: 'ui.wiki'}, function(data){
			});
		}
//	}).navButtonAdd('#pager1', {
//		'caption'       : '',
//		'title'         : 'ギフトサーチ',
//		'buttonicon'    : 'ui-icon-disk',
//		'position'      : 'last',
//		'cursor'        : 'pointer',
//		'onClickButton' : function(){
//			$('input[name="file"]').click();
//		}
	});

	$('#table2').jqGrid({
		datatype: 'local',
		colNames:['ID','ギフトID', '属性', '名前', 'レ', '日付', 'typeId', 'cardImgUrl', '説明'],
		colModel:[
			{
				name: 'id',
				index: 'id',
				width: 40,
				key: true,
				formatter: 'int',
				sorttype: 'int'
			},
			{
				name: 'giftId',
				index: 'giftId',
				width: 60,
				hidden: true
			},
			{
				name:'sphereId',
				index:'sphereId',
				width:50,
				formatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 1:
							return 'COOL';
						case 2:
							return 'SWEET';
						case 3:
							return 'POP';
						default:
							return '-';
					}
				},
				unformatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 'COOL':
							return 1;
						case 'SWEET':
							return 2;
						case 'POP':
							return 3;
						default:
							return 0;
					}
				},
				sortable: false
			},
			{
				name:'name',
				index:'name',
				width:180,
				sortable: false
			},
			{
				name:'rarity',
				index:'rarity',
				width:20,
				align:'center',
				formatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 1:
							return 'N';
						case 2:
							return 'HN';
						case 3:
							return 'R';
						case 4:
							return 'HR';
						case 5:
							return 'SR';
						case 6:
							return 'SSR';
						case 7:
							return 'UR';
						default:
							return '-';
					}
				},
				unformatter: function(cellValue, options, cellObject){
					switch(parseInt(cellValue)){
						case 'N':
							return 1;
						case 'HN':
							return 2;
						case 'R':
							return 3;
						case 'HR':
							return 4;
						case 'SR':
							return 5;
						case 'SSR':
							return 6;
						case 'UR':
							return 7;
						default:
							return 0;
					}
				},
				sortable: false
			},
			{
				name:'date',
				index:'date',
				width: 40,
				align:'center',
				sortable: false
			},
			{
				name:'typeId',
				index:'typeId',
				width:20,
				hidden: true
			},
			{
				name:'cardImgUrl',
				index:'cardImgUrl',
				width:20,
				hidden: true
			},
			{
				name:'description',
				index:'description',
				width:200,
				sortable:false
			}
		],
        sortname: 'id',
        sortorder: 'ASC',
		scroll: 1,
		multiselect: false,
		caption: "ギフトサーチからのインポート",
		pager: $('#pager2'),
		shrinkToFit : true,
		height: 480,
		afterInsertRow: function(rowid, rowData){
			var rowElement = $('#' + rowid, $(this));
			switch(parseInt(rowData.sphereId)){
				case 1:
					rowElement.addClass('cool');
					break;
				case 2:
					rowElement.addClass('sweet');
					break;
				case 3:
					rowElement.addClass('pop');
					break;
			}
		}
	}).navGrid('#pager2', {
		edit: false,
		add: false,
		del: false,
		refresh: false,
		search: false
	},{},{},{},{
		multipleSearch: true,
		closeAfterSearch: true
	}).hideCol('cb').navButtonAdd('#pager2', {
		'caption'       : 'インポート',
		'buttonicon'    : 'ui-icon-check',
		'position'      : 'last',
		'title'         : 'インポート',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			chrome.runtime.sendMessage({action: 'ui.import', gift: $(this).getGridParam('data')}, function(data){
				chrome.runtime.sendMessage({action: 'ui.girls', expr: JSON.parse(window.localStorage.getItem('expr'))}, function(data){
					$('#table1').clearGridData().setGridParam({datatype: 'local', data: data.rows}).trigger("reloadGrid");
				});
			});
			chrome.runtime.sendMessage({action: 'ui.events'}, function(data){
				if(data.rows){
					$('#events').empty();
					for(var i = 0; i < data.rows.length; i ++){
						$('#events').append($('<option>').attr({'value' : data.rows[i].event}).text(data.rows[i].event));
					}
				}
			});
		}
	}).navButtonAdd('#pager2', {
		'caption'       : 'キャンセル',
		'buttonicon'    : 'ui-icon-close',
		'position'      : 'last',
		'title'         : 'キャンセル',
		'cursor'        : 'pointer',
		'onClickButton' : function(){
			$('#gift').show();
			$('#import').hide();
		}
	});

	//	初期値のセット
	var expr = JSON.parse(window.localStorage.getItem('expr'));
	$('input[name="material"]').val([expr.material]);
	$('input[name="rarity"]').val(expr.rarities);
	$('input[name="sphere"]').val(expr.spheres);
	$('input[name="sort"]').val(expr.sorts);
	$('input').on('change', function(){
		var expr = {
			rarities : [],
			material: 2,
			spheres: [],
			sorts: []
		};
		expr.material = $('input[name="material"]:checked').val();
		$('input[name="rarity"]:checked').each(function(){
			expr.rarities.push($(this).val());
		});
		$('input[name="sphere"]:checked').each(function(){
			expr.spheres.push($(this).val());
		});
		$('input[name="sort"]:checked').each(function(){
			expr.sorts.push($(this).val());
		});
		window.localStorage.setItem('expr', JSON.stringify(expr));
		//	データのリクエスト
		chrome.runtime.sendMessage({action: 'ui.girls', expr: JSON.parse(window.localStorage.getItem('expr'))}, function(data){
			console.log(data);
			$('#table1').clearGridData().setGridParam({datatype: 'local', data: data.rows}).trigger("reloadGrid");
		});
	});

	worker.onmessage = function(event){
		$('#gift').hide();
		$('#import').show();
		$('#table2').clearGridData().setGridParam({datatype: 'local', data: event.data}).trigger("reloadGrid");
	};

	$('#rarities').buttonset();
	$('#materials').buttonset();
	$('#spheres').buttonset();
	$('#options').buttonset();

	$('form[name="form2"]').hide();
	$('#import').hide();

	$('input[name="file"]').on('change', function(e){
		var f = e.target.files[0];
		if(f){
			var reader = new FileReader();
			reader.onload = (function(){
				worker.postMessage(reader.result);
			});
			reader.readAsText(f, 'Shift_JIS');
		}
	});

	//	初期データのリクエスト
	chrome.runtime.sendMessage({action: 'ui.girls', expr: JSON.parse(window.localStorage.getItem('expr'))}, function(data){
		console.log(data);
		$('#table1').clearGridData().setGridParam({datatype: 'local', data: data.rows}).trigger("reloadGrid");
	});
});
