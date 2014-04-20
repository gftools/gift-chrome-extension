onmessage = function(event){
	var result = [];
	var rows = event.data.split("\n");
	for(var i = 0; i < rows.length; i ++){
		if(rows[i]){
			var fields = rows[i].split(",");
			result.push({
				id: parseInt(rows.length) - parseInt(fields[0]) - 1,
				sphereId: fields[1],
				rarity: fields[2],
				name: fields[3],
				date: fields[4],
				description: fields[5],
				typeId: fields[6],
				giftId: fields[7],
				cardImgUrl: fields[8]
			});
		}
	}
	postMessage(result);
}
