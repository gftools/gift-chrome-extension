var dbh = window.openDatabase('gifts', '0.1', 'ギフト機能補完拡張', 50 * 1024 * 1024);

var maxPage = 0;
var userId = 0;
var debug = false;
var stop = false;
var enablePageAction = true;

var isPermanent = function(record){
	//	[]つきのものは基本的に恒常ではないが・・・
	return true;
};

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
		permanent   : 1,
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
	/*
		恒常・非恒常判定
	*/
	if(data.event){
		switch(data.event){
			case '耳休め':
			case '冬の日':
			case 'スケボーガール':
				data.permanent = 1;
				break;
			default:
				data.permanent = 0;
				break;
		}
	}else{
		data.permanent = 1;
		//	同名レア度違いで特殊カードが存在するもの
		switch(data.name){
			case '不知火五十鈴':
				if(data.rarity == 4)	data.permanent = 0;	//	デート報酬
				break;
			case '櫻井明音':
				if(data.rarity == 4)	data.permanent = 0;	//	デート報酬
				break;
			case '優木苗':
				if(data.rarity == 4)	data.permanent = 0;	//	デート報酬
				break;
			case '芹那':
				if(data.rarity == 3)	data.permanent = 0;	//	特殊
				break;
			case '吉野屋先生':
				if(data.rarity == 3)	data.permanent = 0;	//	特殊
				break;
			case '神崎ミコト':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '新垣雛菜':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '桐山優月':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '新田萌果':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '見吉奈央':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '玉井麗巳':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '霧生典子':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '五代律':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '螺子川来夢':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '西野彩音':
				if(data.rarity == 3)	data.permanent = 0;	//	秘蔵写真
				break;
			case '小日向いちご':
				if(data.rarity == 4)	data.permanent = 0;	//	秘蔵写真
				break;
			case '掛井園美':
				if(data.rarity == 3)	data.permanent = 0;	//	登校
				break;
			case '飛原鋭子':
				if(data.rarity == 3)	data.permanent = 0;	//	登校
				break;
			case '竜ヶ崎珠里椏':
				if(data.rarity == 3)	data.permanent = 0;	//	登校
				break;
			case '戸村美知留':
				if(data.rarity == 3)	data.permanent = 0;	//	登校
				break;
			case '夢前春瑚':
				if(data.rarity == 3)	data.permanent = 0;	//	登校
				break;
		}
	}
	var ids = gift.giftId.match(/([0-9]+)_(.+)/);
	if(ids)	data.userId = parseInt(ids[1]);
	return data;
};

if(!window.localStorage.getItem('setting')){
	window.localStorage.setItem('setting', JSON.stringify({
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
	}));
}

var setting = JSON.parse(window.localStorage.getItem('setting'));

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
	},
	stop: false
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
	permanent int not null default 0,
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
			txn.executeSql('CREATE INDEX IF NOT EXISTS girls_permanent_index ON girls(permanent)');
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
	permanent int not null default 0,
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
	*	設定読み出し
	*
	*/
	if(message.action == 'ui.setting.get'){
		sendResponse(setting);
		return true;
	}
	/**
	*
	*	設定保存
	*
	*/
	if(message.action == 'ui.setting.set'){
		if(message.setting){
			if(message.setting.useragent){
				setting.useragent = message.setting.useragent;
			}
			if(message.setting.interval){
				setting.interval = parseInt(message.setting.interval) * 1000;
				if(!setting.interval){
					setting.interval = 2000;
				}
			}
			console.log(setting);
			window.localStorage.setItem('setting', JSON.stringify(setting));
		}
	}
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
//		var statement = "SELECT girls.id, girls.giftId, girls.cardImgUrl, girls.sphereId, girls.name, girls.event, girls.shortName, girls.date, girls.rarity, girls.trainer, girls.typeId, girls.description, girls.userId, wiki.cost, wiki.attack, wiki.defence, wiki.yell, wiki.cv FROM girls LEFT OUTER JOIN wiki ON girls.typeId = wiki.id";
		var statement = "SELECT g.id, g.giftId, g.cardImgUrl, g.sphereId, g.name, g.event, g.shortName, g.date, g.rarity, g.trainer, g.permanent, g.typeId, g.description, g.userId, w.cost, w.attack, w.defence, w.yell, w.cv, s.stock FROM girls g LEFT OUTER JOIN wiki w ON g.typeId = w.id LEFT OUTER JOIN (SELECT typeId, COUNT(typeId) as stock FROM girls GROUP BY typeId) s ON g.typeId = s.typeId";
		if(message.expr){
			console.log(message.expr);
			//	クエリの組み立て
			var wheres = [];
			if(message.expr.rarities && message.expr.rarities.length){
				wheres.push(sprintf("g.rarity IN(%s)", message.expr.rarities.join(', ')));
			}
			if(message.expr.spheres){
				wheres.push(sprintf("g.sphereId IN(%s)", message.expr.spheres.join(', ')));
			}
			if(message.expr.material){
				if(message.expr.material > 0){
					wheres.push(sprintf("g.trainer = %d", message.expr.material - 1));
				}
			}
			switch(parseInt(message.expr.permanent)){
				case 0:
					wheres.push("g.permanent = 0");
					break;
				case 1:
					wheres.push("g.permanent = 1");
					break;
			}
			if(userId){
				wheres.push(sprintf("g.userId = %d", parseInt(userId)));
			}
			statement = statement + ' WHERE ' + wheres.join(' AND ');
		}
		console.log(statement);
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
	/**
	*
	*	Windowsネイティブギフトサーチからのインポート
	*
	*/
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
			UI.unblock();
		}, function(){
			UI.unblock();
		});
	}
	/**
	*
	*	データ全更新
	*
	*/
	if(message.action == 'ui.sync'){
		async.series([
			function(nextProcess){
				UI.block('ギフトデータの取得準備中です');
				dbh.transaction(function(txn){
					txn.executeSql("DELETE FROM girls");
					txn.executeSql("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'girls'");
				}, function(e){
					nextProcess(e);
				}, function(){
					nextProcess();
				});
			},
			function(nextProcess){
				var page    = 1;
				var maxPage = 0;
				async.doWhilst(
					function(nextPage){	//	process
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
								if(result.data && result.data.maxPage){
									maxPage = parseInt(result.data.maxPage);
								}
								dbh.transaction(function(txn){
									async.eachSeries(result.data.results, function(_record, nextRecord){
										var record = transform(_record);
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
											values,
											function(txn, rs){
												nextRecord();
											}
										);
									});
								}, function(e){
									console.log(e);
								}, function(){
									console.log('DML Complete');
									page ++;
									setTimeout(nextPage, setting.interval + Math.floor(Math.random() * 1000));
								});
							}
						});
					},
					function(){	//	test
						return page <= maxPage;
					},
					function(err){	//	callback
						nextProcess(err);
					}
				);	/**	doWhilst */
			}
		], function(err){
			UI.unblock();
		});	/**	series */
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
					nextProcess(true, e);
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
								sphere      : 0,
								sort        : 0,
								rarity      : 0,
								other       : 0,
								page        : page || 1,
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
		async.waterfall([
			function(nextProcess){
				UI.block('ギフトの取得準備中です');
				$.ajax({
					url:  'http://vcard.ameba.jp/giftbox?selectedGift=1&page=1',
					type: 'GET'
				}).done(function(html){
					var $container = $('<div/>');
					var $html = $.parseHTML(html);
					$container.append($html);
					var $token = $container.find('#__token');
					token = $($token).val();
					var $fcRed = $container.find('dt.fcRed:contains("ガールの所持上限を超えています")');
					if($fcRed.length > 0){
						nextProcess(true, null);
					}else{
						if(token){
							nextProcess(null, token);
						}else{
							nextProcess(true, null);
						}
					}
				});
			},
			function(token, nextProcess){
				var i = 0;
				async.eachSeries(giftIds, function(giftId, nextRecord){
					UI.set(sprintf("ギフトの取得中です(%d / %d)", i + 1, giftIds.length));
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
						//	次のデータ取得条件は2つ
						//	1.受け取りが押せる状態になっていること
						//	2.次のトークンがとれていること
						//	若林さんや受け取りが押せない場合はここでストップする
						var $container = $('<div/>');
						var $html = $.parseHTML(html);
						$container.append($html);
						var $token = $container.find('#__token');
						token = $($token).val();
						var $fcRed = $container.find('dt.fcRed:contains("ガールの所持上限を超えています")');
						//	これ以上受け取れない
						if($fcRed.length > 0){
							i ++;
							nextRecord(true);
						}else{
							if(token){
								dbh.transaction(function(txn){
									console.log('Received giftId=' + giftId);
									txn.executeSql(
										"DELETE FROM girls WHERE giftId = ?",
										[ giftId ]
									);
								}, function(e){
									setTimeout(function(){
										i ++;
										nextRecord(true);
									}, setting.interval + Math.floor(Math.random() * 1000));
								}, function(){
									setTimeout(function(){
										i ++;
										nextRecord();
									}, setting.interval + Math.floor(Math.random() * 1000));
								});
							}else{
								//	トークンがない
								i ++;
								nextRecord(true);
							}
						}
					});
				}, function(err){
					nextProcess(err);
				});
			}
		], function(err){
			UI.unblock();
		});
	}
	/**
		連続データ取得のストップ
	*/
	if(message.action == 'ui.stop'){
		stop = true;
	}
});
