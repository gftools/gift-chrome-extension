var dbh = window.openDatabase('gifts', 1, 'ギフト機能補完拡張', 50 * 1024 * 1024);
var maxPage = 0;
var token = '';
var userId = 0;
var debug = false;
var stop = false;
var enablePageAction = true;

var transform = function(gift){
	var data = {
		giftId      : gift.giftId,
		cardImgUrl  : gift.cardImgUrl,
		sphereId    : parseInt(gift.sphereId),
		name        : gift.name.toZenkanaCase().toPaddingCase().toHankakuCase(),
		shortName   : gift.name.replace(/\[.+\]/, ''),
		event       : '',
		date        : gift.date,
		rarity      : parseInt(gift.rarity),
		trainer     : 0,
		typeId      : parseInt(gift.typeId),
		description : gift.description.toZenkanaCase().toPaddingCase().toHankakuCase(),
		userId      : 0
	};
	if(gift.id) data.id = gift.id;
	var events = gift.name.match(/\[(.+)\]/);
	if(events){
		var event = events[1];
		switch(event){
			case 'SWEET':
			case 'POP':
			case 'COOL':
				data.event = '';
				break;
			default:
				data.event = event.toZenkanaCase().toPaddingCase().toHankakuCase();
				break;
		}
	}
	if(gift.name.indexOf('久保田友季') != -1) data.trainer = 1;
	if(gift.name.indexOf('荒井薫') != -1) data.trainer = 1;
	if(gift.name.indexOf('畑山政子') != -1) data.trainer = 1;
	var ids = gift.giftId.match(/([0-9]+)_(.+)/);
	if(ids)	data.userId = parseInt(ids[1]);
	return data;
};

var update = function(records, handler){
	dbh.transaction(function(txn){
		for(var i = 0; i < records.length; i ++){
			if(records[i].giftId){
				var record = transform(records[i]);
				var columns = [];
				var placeholders = [];
				var values = [];
				for(var column in record){
					columns.push(column);
					placeholders.push('?');
					values.push(record[column]);
				}
				txn.executeSql(
					sprintf("INSERT OR REPLACE INTO diffs(%s) VALUES(%s)", columns.join(', '), placeholders.join(', ')),
					values
				);
			}
		}
	}, function(e){
		console.log(e);
	}, function(){
		console.log('DML Complete');
	});
};


var setting = {
	useragent: 'Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/KRT16M) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36',
    disable_all: true,
	interval: 2000,
	wikipages: [
		'http://www52.atwiki.jp/vcard/m/pages/29.html',
		'http://www52.atwiki.jp/vcard/m/pages/30.html',
		'http://www52.atwiki.jp/vcard/m/pages/31.html',
		'http://www52.atwiki.jp/vcard/m/pages/32.html',
		'http://www52.atwiki.jp/vcard/m/pages/33.html',
		'http://www52.atwiki.jp/vcard/m/pages/34.html'
	]
};

var UI = {
	block: function(text){
		chrome.tabs.query({
			url: '*://vcard.ameba.jp/giftbox*'
		}, function(tabs){
			tabs.forEach(function(tab){
			    chrome.tabs.sendMessage(tab.id, {action: 'ui.block.begin', text: text});
				chrome.pageAction.hide(tab.id);
			});
		});
		enablePageAction = false;
	},
	set: function(text){
		chrome.tabs.query({
			url: '*://vcard.ameba.jp/giftbox*'
		}, function(tabs){
			tabs.forEach(function(tab){
			    chrome.tabs.sendMessage(tab.id, {action: 'ui.block.set', text: text});
				chrome.pageAction.hide(tab.id);
			});
		});
	},
	unblock: function(){
		chrome.tabs.query({
			url: '*://vcard.ameba.jp/giftbox*'
		}, function(tabs){
			tabs.forEach(function(tab){
			    chrome.tabs.sendMessage(tab.id, {action: 'ui.block.end'});
				chrome.pageAction.show(tab.id);
			});
		});
		enablePageAction = true;
	}
}

//	インストール時のハンドラ
chrome.runtime.onInstalled.addListener(function(){
	if(window.localStorage.getItem('setting')){
		setting = JSON.parse(window.localStorage.getItem('setting'));
	}else{
		window.localStorage.setItem('setting', JSON.stringify(setting));
	}

		dbh.transaction(function(txn){
			txn.executeSql((function (){/*
CREATE TABLE IF NOT EXISTS girls(
	id integer primary key autoincrement,
	giftId varchar(255),
	cardImgUrl text default '',
	sphereId int default 0,
	name text default '',
	event text default '',
	shortName text default '',
	date int default 0,
	rarity int not null default 0,
	trainer int not null default 0,
	typeId int not null default 0,
	description text not null default '',
	userId int not null default 0
)
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]);
			txn.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS girls_giftId_index ON girls(giftId)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_sphereId_index ON girls(sphereId)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_name_index ON girls(name)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_event_index ON girls(event)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_shortName_index ON girls(shortName)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_date_index ON girls(date)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_rarity_index ON girls(rarity)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_trainer_index ON girls(trainer)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_userId_index ON girls(userId)');

/**
	差分の一時保存用
*/
			txn.executeSql((function (){/*
CREATE TABLE IF NOT EXISTS diffs(
	id integer primary key autoincrement,
	giftId varchar(255),
	cardImgUrl text default '',
	sphereId int default 0,
	name text default '',
	event text default '',
	shortName text default '',
	date int default 0,
	rarity int not null default 0,
	trainer int not null default 0,
	typeId int not null default 0,
	description text not null default '',
	userId int not null default 0
)
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]);
			txn.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS diffs_giftId_index ON diffs(giftId)');

			txn.executeSql((function (){/*
CREATE TABLE IF NOT EXISTS wiki(
	id INT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL DEFAULT '',
	level_max NOT NULL DEFAULT 0,
	heart_max NOT NULL DEFAULT 0,
	attack NOT NULL DEFAULT 0,
	defence NOT NULL DEFAULT 0,
	cost NOT NULL DEFAULT 0,
	attack_per_cost NOT NULL DEFAULT 0,
	defence_per_cost NOT NULL DEFAULT 0,
	yell TEXT NOT NULL DEFAULT '',
	cv TEXT NOT NULL DEFAULT ''
)
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]);
			txn.executeSql('CREATE INDEX IF NOT EXISTS wiki_attack_index ON wiki(attack)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS wiki_defence_index ON wiki(defence)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS wiki_cost_index ON wiki(cost)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS wiki_yell_index ON wiki(yell)');
			txn.executeSql('CREATE INDEX IF NOT EXISTS wiki_cv_index ON wiki(cv)');
		}, function(e){
			console.log(e);
		}, function(){
			console.log('DDL Complete');
		});

});
//	該当ページへのアクセスはUserAgent偽装
chrome.webRequest.onBeforeSendHeaders.addListener(
	function(info) {
		var headers = info.requestHeaders;
		headers.forEach(function(header, i) {
			if(header.name.toLowerCase() == 'user-agent'){ 
				header.value = setting.useragent;
			}
		});
		return {requestHeaders: headers};
	},{
		urls: [
			"*://*.ameba.jp/*",
			"*://*.amebame.com/*"
		],
		types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest"]
	},[
		"blocking",
		"requestHeaders"
	]
);
//	ページのDOMツリー生成時のイベント
chrome.webNavigation.onDOMContentLoaded.addListener(function(e){
	if(e.url.indexOf('vcard.ameba.jp/giftbox') != -1){
		//	PageActionの有効化
		if(enablePageAction){
			chrome.pageAction.show(e.tabId);
		}
		chrome.tabs.sendMessage(e.tabId, {
			action: 'background.userId'
		}, function(response){
			userId = response.userId;
			console.log('userId=' + userId);
		});
	}else{
		chrome.pageAction.hide(e.tabId);
	}
}, {
	hostSuffix: 'vcard.ameba.jp'
});

//	データ処理用イベントリスナ
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	/**
	*
	*	イベント名リスト取得
	*
	*/
	if(message.action == 'ui.events'){
		var response = {
			records: 0,
			rows: []
		};
		dbh.transaction(function(txn){
			txn.executeSql("SELECT distinct(girls.event) FROM girls", [], function(txn, result){
				if(response.rows && result.rows.length){
					response.records = result.rows.length;
					for(var i = 0; i < result.rows.length; i ++){
						response.rows.push(result.rows.item(i));
					}
					sendResponse(response);
				}else{
					sendResponse(response);
				}
			});
		}, function(e){
			console.log(e);
		}, function(){
			console.log('DML Complete');
		});
		return true;
	}
	/**
	*
	*	ギフト検索
	*
	*/
	if(message.action == 'ui.girls'){
		var response = {
			records: 0,
			rows: []
		};
		var statement = "SELECT girls.id, girls.giftId, girls.cardImgUrl, girls.sphereId, girls.name, girls.event, girls.shortName, girls.date, girls.rarity, girls.trainer, girls.typeId, girls.description, girls.userId, wiki.cost, wiki.attack, wiki.defence, wiki.yell, wiki.cv FROM girls LEFT OUTER JOIN wiki ON girls.typeId = wiki.id";
		if(message.expr){
			//	クエリの組み立て
			var wheres = [];
			if(message.expr.rarities && message.expr.rarities.length){
				wheres.push(sprintf("girls.rarity IN(%s)", message.expr.rarities.join(', ')));
			}
			if(message.expr.spheres){
				wheres.push(sprintf("girls.sphereId IN(%s)", message.expr.spheres.join(', ')));
			}
			if(message.expr.material){
				if(message.expr.material > 0){
					wheres.push(sprintf("girls.trainer = %d", message.expr.material - 1));
				}
			}
			if(userId){
				wheres.push(sprintf("girls.userId = %d", parseInt(userId)));
			}
			statement = statement + ' WHERE ' + wheres.join(' AND ');
		}
		dbh.transaction(function(txn){
			txn.executeSql(statement, [], function(txn, result){
				if(result.rows && result.rows.length){
					response.records = result.rows.length;
					for(var i = 0; i < result.rows.length; i ++){
						response.rows.push(result.rows.item(i));
					}
					sendResponse(response);
				}
			});
		}, function(e){
			console.log(e);
		}, function(){
		});
		return true;
	}

	if(message.action == 'ui.import'){
		UI.block('ギフトデータのインポート中です');
		dbh.transaction(function(txn){
			for(var i = message.gift.length - 1; i >= 0; i --){
				var record = transform(message.gift[i]);
				var columns = [];
				var placeholders = [];
				var values = [];
				for(var column in record){
					columns.push(column);
					placeholders.push('?');
					values.push(record[column]);
				}
				txn.executeSql(
					sprintf("INSERT OR REPLACE INTO girls(%s) VALUES(%s)", columns.join(', '), placeholders.join(', ')),
					values
				);
			}
		}, function(e){
			console.log(e);
			UI.unblock();
		}, function(){
			console.log('Import Complete');
			UI.unblock();
		});
	}
	/**
	*
	*	データ全更新
	*
	*/
	if(message.action == 'ui.sync'){
		UI.block('ギフトデータの取得準備中です');
		dbh.transaction(function(txn){
			txn.executeSql("DELETE FROM girls");
			txn.executeSql("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'girls'");
		}, function(e){
			console.log(e);
		}, function(){
		});
		stop = false;
		var page    = 1;
		var maxPage = 0;
		var fetch = function(){
			UI.set(sprintf('ギフトデータの取得中です(%d/%d)', page, maxPage));
			/* 昔もらった順 */
			$.ajax({
				url: 'http://vcard.ameba.jp/giftbox/gift-search',
				type: 'POST',
				data: {
					sphere: 0,
					sort: 1,
					rarity: 0,
					other: 0,
					page: page || 1,
					selectedGift: 1
				}
			}).done(function(result){
				if(result.resultStatus && result.resultStatus === 'success'){
					if(result.data && result.data.maxPage)
						maxPage = parseInt(result.data.maxPage);
					dbh.transaction(function(txn){
						for(var i = 0; i < result.data.results.length; i ++){
							var record = transform(result.data.results[i]);
							var columns = [];
							var placeholders = [];
							var values = [];
							for(var column in record){
								columns.push(column);
								placeholders.push('?');
								values.push(record[column]);
							}
							txn.executeSql(
								sprintf(
									"INSERT OR REPLACE INTO girls(%s) VALUES(%s)",
									columns.join(', '),
									placeholders.join(', ')
								),
								values
							);
						}
					}, function(e){
						console.log(e);
					}, function(){
						console.log('DML Complete');
					});
				}
				page ++;
				if(page > maxPage || stop){
					stop = false;
					UI.unblock();
				}else{
					setTimeout(fetch, setting.interval + Math.floor(Math.random() * 1000));
				}
			});
		}
		fetch();
	}
	/**
	*
	*	データ前方更新
	*
	*/
	if(message.action == 'ui.diff'){
		async.series([
			function(nextProcess){
				UI.block('ギフトデータの取得準備中です');
				dbh.transaction(function(txn){
					txn.executeSql("DELETE FROM diffs");
					txn.executeSql("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'diffs'");
				}, function(e){
					callback(true, e);
				}, function(){
					nextProcess(null, null);
				});
			},
			function(nextProcess){
				var page    = 1;
				var maxPage = 0;
				var hasNext = false;
				async.doWhilst(function(nextPage){	//	process
						UI.set(sprintf('ギフトデータの取得中です(%d/%d)', page, maxPage));
						/* 最近もらった順にして検索 */
						$.ajax({
							url: 'http://vcard.ameba.jp/giftbox/gift-search',
							type: 'POST',
							data: {
								sphere: 0,
								sort: 0,
								rarity: 0,
								other: 0,
								page: page || 1,
								selectedGift: 1
							}
						}).done(function(result){
							if(result.data && result.data.maxPage){
								maxPage = parseInt(result.data.maxPage);
								async.eachSeries(result.data.results, function(_record, nextRecord){
									var record = transform(_record);
									async.waterfall([
										function(nextTransaction){
											dbh.transaction(function(txn){
												txn.executeSql(sprintf("SELECT * FROM girls WHERE giftId = '%s'", record.giftId), [],	function(txn, result){
													console.log(result);
													nextTransaction(result.rows.length, record);
												});
											});
										},
										function(record, nextTransaction){
											console.log(record);
											var columns = [];
											var placeholders = [];
											var values = [];
											for(var column in record){
												columns.push(column);
												placeholders.push('?');
												values.push(record[column]);
											}
											dbh.transaction(function(txn){
												txn.executeSql(
													sprintf("INSERT OR REPLACE INTO diffs(%s) VALUES(%s)", columns.join(', '), placeholders.join(', ')),
													values
												);
											},
											function(e){
											},
											function(){
												nextTransaction();
											});
										}
									], function(err){
										nextRecord(err);
									}); /* waterfall */
								}, function(err){
									if(err){
										hasNext = false;
									}else{
										if(page < maxPage){
											page ++;
											hasNext = true;
										}else{
											hasNext = false;
										}
									}
							        setTimeout(nextPage, setting.interval + Math.floor(Math.random() * 1000));
								});	/* eachSeries */
							}else{
								maxPage = 0;
								hasNext = false;
						        setTimeout(nextPage, setting.interval + Math.floor(Math.random() * 1000));
							}
						});
				    },
				    function(){	//	test
						return hasNext;
				    },
				    function(err){	//	callback
    					nextProcess(null, null);
				    }
				);
			},
			function(nextProcess){
				dbh.transaction(function(txn){
					txn.executeSql("INSERT INTO girls(giftId, cardImgUrl, sphereId, name, event, shortName, date, rarity, trainer, typeId, description, userId) SELECT giftId, cardImgUrl, sphereId, name, event, shortName, date, rarity, trainer, typeId, description, userId FROM diffs ORDER BY id DESC");
					txn.executeSql("DELETE FROM diffs");
					txn.executeSql("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'diffs'");
				});
				nextProcess();
			}
		], function(err, results){
			console.log(results);
			UI.unblock();
		});
	}
	/**
	*
	*	wikiデータ同期
	*
	*/
	if(message.action == 'ui.wiki'){
		UI.block('wikiページの取得準備中です');
		var i = 0;
		async.whilst(
			function(){ return i < setting.wikipages.length; },
			function(callback){
				$.ajax({
					url:  setting.wikipages[i],
					type: 'GET'
				}).done(function(html){
					UI.set(sprintf("wikiページの処理中です(%d / %d)", i + 1, setting.wikipages.length));
					$('tr', $(html)).filter(function(){
						var tds = $('td', $(this));
						if(tds.length < 14){
							return;
						}
						var girl = {
							id: parseInt($(tds[0]).text()) || 0,
							name: $(tds[2]).text().toZenkanaCase().toPaddingCase().toHankakuCase() || '',
							level_max: parseInt($(tds[5]).text()) || 0,
							heart_max: parseInt($(tds[6]).text()) || 0,
							attack: parseInt($(tds[7]).text()) || 0,
							defence: parseInt($(tds[8]).text()) || 0,
							cost: parseInt($(tds[9]).text()) || 0,
							attack_per_cost: parseInt($(tds[10]).text()) || 0,
							defence_per_cost: parseInt($(tds[11]).text()) || 0,
							yell: $(tds[12]).text().toZenkanaCase().toPaddingCase().toHankakuCase() || '',
							cv: $(tds[13]).text().toZenkanaCase().toPaddingCase().toHankakuCase() || ''
						};
						var columns = [];
						var placeholders = [];
						var values = [];
						for(var column in girl){
							columns.push(column);
							placeholders.push('?');
							values.push(girl[column]);
						}
						dbh.transaction(function(txn){
							txn.executeSql(
								sprintf("INSERT OR REPLACE INTO wiki(%s) VALUES(%s)", columns.join(', '), placeholders.join(', ')),
								values
							);
						}, function(e){
							console.log(e);
						}, function(){
							console.log('DML Complete');
						});
					});
					i ++;
					setTimeout(callback, setting.interval + Math.floor(Math.random() * 1000));
				});
			},
			function(err){
				UI.unblock();
			}
		);
	}
	/**
	*
	*	ギフト受けとり
	*
	*/
	if(message.action == 'ui.receive'){
		var giftIds = message.ids;
		UI.block('ギフトの取得準備中です');
		if(giftIds.length > 0){
			$.ajax({
				url:  'http://vcard.ameba.jp/giftbox?selectedGift=1&page=1',
				type: 'GET'
			}).done(function(html){
				var $container = $('<div/>');
				var $html = $.parseHTML(html);
				$container.append($html);
				var $token = $container.find('#__token');
				token = $($token).val();
				console.log('token=' + token);
				var giftId = '';
				if(token){
					var i = 0;
					var max = giftIds.length;
					var fetch = function(){
						UI.set(sprintf('ギフトの取得中です(%d/%d)', i + 1, max));
						giftId = giftIds[i];
						$.ajax({
							url:  'http://vcard.ameba.jp/giftbox/giftbox-system-select-recive',
							type: 'POST',
							data: {
								sort: 0,
								sphere: 0,
								rarity: 0,
								other: 0,
								giftId: giftId,
								token: token,
								selectedGift: 1,
								page: 1,
								submit: '受け取る'
							}
						}).done(function(html){
							var $container = $('<div/>');
							var $html = $.parseHTML(html);
							$container.append($html);
							var $token = $container.find('#__token');
							token = $($token).val();
							//	次のトークンがとれたら成功とみなす
							if(token){
								dbh.transaction(function(txn){
									console.log('giftId=' + giftId);
									txn.executeSql(
										"DELETE FROM girls WHERE giftId = ?",
										[ giftId ]
									);
								}, function(e){
									console.log(e);
								}, function(){
									console.log('DML Complete');
								});
								i ++;
								if(i >= max || stop){
									UI.unblock();
								}else{
									setTimeout(fetch, setting.interval + Math.floor(Math.random() * 1000));
								}
							}else{
								UI.unblock();
							}
						});
					};
					fetch();
				}
			});
		}else{
			UI.unblock();
		}
	}
	/**
		連続データ取得のストップ
	*/
	if(message.action == 'ui.stop'){
		stop = true;
	}
});
