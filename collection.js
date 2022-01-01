function BGGModel(){
    this.username = ko.observable("berge403,computerdaz")
    this.playerCounts = ko.observableArray([1,2,3,4,5,6,7,8,9,10])
    this.selectedPlayerCounts = ko.observableArray([]) 
    this.preferredWeight = ko.observable(3.5).extend({ rateLimit: 250 });
    this.maxTime = ko.observable(180).extend({ rateLimit: 250 });
    this.all_games = ko.observableArray([])
    this.base_games = ko.computed(function(){
        return this.all_games().filter(g => g.subtype()=="boardgame")
    },this)
    this.categories = ko.computed(function(){
        return this.base_games().map(g => g.categories()).reduce((a,b)=> {
            for(var i of b){
                if(!(a.includes(i))){
                    a.push(i)
                }
            }
            return a
        },[]).sort()
    },this)
    this.selectedCategories = ko.observableArray([])
    this.mechanics = ko.computed(function(){
        return this.base_games().map(g => g.mechanics()).reduce((a,b)=> {
            for(var i of b){
                if(!(a.includes(i))){
                    a.push(i)
                }
            }
            return a
        },[]).sort()
    },this)
    this.selectedMechanics = ko.observableArray([])
    this.all_games_byid = {}
    // this.expansions = ko.observableArray([])
    // this.expansions_byid = {}
    this.score_player_scalar = function(ci){
        let player_scalar = 1
        if (this.selectedPlayerCounts().length>0){
            let player_scalars = this.selectedPlayerCounts().map(
                numplayers => ci.suggested_player_counts()[numplayers].recommended_percvotes() + ci.suggested_player_counts()[numplayers].best_percvotes()*2
            )
            player_scalar = player_scalars.reduce((a, b) => a + b)/player_scalars.length
        }
        return player_scalar
    }
    this.score_category_scalar = function(ci){
        let category_scalar = 1
        if (this.selectedCategories().length>0){
            category_scalar = 1 +  this.selectedCategories().map(mech => ci.categories().includes(mech)?1:0).reduce((a,b)=>a+b) // / this.selectedCategories().length
        }
        return category_scalar
    }
    this.score_mechanic_scalar = function(ci){
        let mechanic_scalar = 1
        if (this.selectedMechanics().length>0){
            mechanic_scalar = 1 +  this.selectedMechanics().map(mech => ci.mechanics().includes(mech)?1:0).reduce((a,b)=>a+b) // / this.selectedMechanics().length
        }
        return mechanic_scalar
    }
    this.score_weight_scalar = function(ci){
        let weight_scalar = 1+1 - (Math.abs(ci.stats_weight_avg()-this.preferredWeight())/ci.stats_weight_avg())
        return weight_scalar
    }
    this.score = function(ci){
        return this.score_category_scalar(ci) * this.score_mechanic_scalar(ci) * this.score_weight_scalar(ci)*this.score_player_scalar(ci)*ci.stats_rating_bayesavg()
    }
    this.games_filtered_sorted = ko.computed(function(){
        let result = this.base_games()
        if(this.selectedPlayerCounts().length>0){
            result = result.filter(g => g.minplayers()<=Math.min(...this.selectedPlayerCounts()) && g.maxplayers()>=Math.max(...this.selectedPlayerCounts()))
        }
        result = result.filter(g => g.minplaytime()<=this.maxTime()*1.25)
        // let scoreFunc = (ci) => {
            // let player_scalar = 1
            // if (this.selectedPlayerCounts().length>0){
            //     let player_scalars = this.selectedPlayerCounts().map(
            //         numplayers => ci.suggested_player_counts()[numplayers].recommended_percvotes() + ci.suggested_player_counts()[numplayers].best_percvotes()*2
            //     )
            //     player_scalar = player_scalars.reduce((a, b) => a + b)/player_scalars.length
            // }
            // let category_scalar = 1
            // if (this.selectedCategories().length>0){
            //     category_scalar = 1 +  this.selectedCategories().map(mech => ci.categories().includes(mech)?1:0).reduce((a,b)=>a+b) // / this.selectedCategories().length
            // }
            // let mechanic_scalar = 1
            // if (this.selectedMechanics().length>0){
            //     mechanic_scalar = 1 +  this.selectedMechanics().map(mech => ci.mechanics().includes(mech)?1:0).reduce((a,b)=>a+b) // / this.selectedMechanics().length
            // }
            // let weight_scalar = 1+1 - (Math.abs(ci.stats_weight_avg()-this.preferredWeight())/ci.stats_weight_avg())
            // let cate
            // return this.score_category_scalar(ci) * this.score_mechanic_scalar(ci) * this.score_weight_scalar(ci)*this.score_player_scalar(ci)*ci.stats_rating_bayesavg()
            // return this.score(ci)
        // }
        // result = result.sort((a,b)=> {
        //     if (this.score(a)<this.score(b)) {return -1 }
        //     if (this.score(a)>this.score(b)) {return 1 }
        //     return 0
        // }).reverse()
        result.sort((ci_a,ci_b)=> {
            a = this.score(ci_a)
            b = this.score(ci_b)
            if (isNaN(a) && isNaN(b)) return 0
            if (isNaN(a)) return -1
            if (isNaN(b)) return 1
            if (a>b) return 1
            if (b>a) return -1
            return 0
            // return this.score(a)-this.score(b)
        })//.reverse()
        result.reverse()
        return result
    },this)
    
    this.loaduser = () => {
        if(this.username().length>0){
            names = this.username().split(",")
            for(var name of names){
                $("#loading").show()
                $("#loadfail").hide()
            //Get https://api.geekdo.com/xmlapi2/collection?username=berge403
                try{
                    processCollection(name) //.then(onRejected= () => new Promise(r => setTimeout(r, 1000)).then(()=>processCollection(username)))
                } catch (err) {
                    console.log(err)
                    $("#loading").hide()
                    $("#loadfail").show()
                }
            }
        }
    }
}
getCollection = function(username){
    return $.get( "https://api.geekdo.com/xmlapi2/collection?username="+username, function ( data, textStatus, xhr ) {
        if(xhr.status==200){
            return (data, textStatus, xhr )
        } else {
            throw xhr.status+" "+textStatus
        }
    })
}
getThings = function(ids){
    return $.get( "https://api.geekdo.com/xmlapi2/thing?stats=1&id="+(ids.join(",")))
    .then(onFulfilled = ( data, textStatus, xhr ) => {
        let items = data.children[0].children
        for(var item of items){
            id = parseInt(item.attributes['id'].value)
            // isBoardgame = item.attributes['type'].value=="boardgame"
            var obj = koModel.all_games_byid[id]
            if (obj == undefined) {continue}
            //Have to set it from thing. collection is incorrect
            obj.subtype(item.attributes['type'].value)
            obj.description(item.getElementsByTagName('description')[0].textContent)
            obj.minplayers(parseInt(item.getElementsByTagName('minplayers')[0].attributes['value'].value))
            obj.maxplayers(parseInt(item.getElementsByTagName('maxplayers')[0].attributes['value'].value))
            polls = Array.from(item.getElementsByTagName('poll'))
            poll_suggested_numplayers = polls.filter(p => p.attributes["name"].value=="suggested_numplayers")[0]
            // totalvotes = parseInt(poll_suggested_numplayers.attributes['totalvotes'].value)
            poll_suggested_numplayers_results = poll_suggested_numplayers.getElementsByTagName('results')
            for(var results of poll_suggested_numplayers_results){
                numplayers = results.attributes['numplayers'].value
                if(numplayers>12){continue}
                if (numplayers.includes("+")){
                    continue
                }
                numplayers = parseInt(numplayers)
                suggested = obj.suggested_player_counts()[numplayers]
                result_elems = Array.from(results.getElementsByTagName('result'))
                best = result_elems.filter(r => r.attributes['value'].value=="Best")[0]
                suggested.best_numvotes(parseInt(best.attributes['numvotes'].value))
                recommended =result_elems.filter(r => r.attributes['value'].value=="Recommended")[0]
                suggested.recommended_numvotes(parseInt(recommended.attributes['numvotes'].value))
                notrecommended = result_elems.filter(r => r.attributes['value'].value=="Not Recommended")[0]
                suggested.notrecommended_numvotes(parseInt(notrecommended.attributes['numvotes'].value))
                totalvotes = suggested.best_numvotes() + suggested.recommended_numvotes() + suggested.notrecommended_numvotes()
                //calculate percentages
                suggested.best_percvotes(suggested.best_numvotes()/totalvotes)
                suggested.recommended_percvotes(suggested.recommended_numvotes()/totalvotes)
                suggested.notrecommended_percvotes(suggested.notrecommended_numvotes()/totalvotes)
            }
            obj.minplaytime(parseInt(item.getElementsByTagName('minplaytime')[0].attributes['value'].value))
            obj.maxplaytime(parseInt(item.getElementsByTagName('maxplaytime')[0].attributes['value'].value))
            links = Array.from(item.getElementsByTagName('link'))
            obj.categories(links.filter(p => p.attributes["type"].value=="boardgamecategory").map(r => r.attributes['value'].value))
            obj.mechanics(links.filter(p => p.attributes["type"].value=="boardgamemechanic").map(r => r.attributes['value'].value))
            obj.families(links.filter(p => p.attributes["type"].value=="boardgamefamily").map(r => r.attributes['value'].value))
            links_expansions = links.filter(p => p.attributes["type"].value=="boardgameexpansion" && p.attributes["inbound"]!=undefined)
            obj.expansions(links_expansions.map(r => r.attributes['value'].value))
            obj.expansion_ids(links_expansions.map(r => r.attributes['id'].value))
            ratings = item.getElementsByTagName('statistics')[0].getElementsByTagName("ratings")[0]
            obj.stats_rating_num(parseInt(ratings.getElementsByTagName("usersrated")[0].attributes['value'].value))
            obj.stats_rating_avg(parseFloat(ratings.getElementsByTagName("average")[0].attributes['value'].value))
            obj.stats_rating_bayesavg(parseFloat(ratings.getElementsByTagName("bayesaverage")[0].attributes['value'].value))
            obj.stats_rating_std(parseFloat(ratings.getElementsByTagName("stddev")[0].attributes['value'].value))
            obj.stats_weight_num(parseFloat(ratings.getElementsByTagName("numweights")[0].attributes['value'].value))
            obj.stats_weight_avg(parseFloat(ratings.getElementsByTagName("averageweight")[0].attributes['value'].value))
            ranks = ratings.getElementsByTagName("ranks")[0].getElementsByTagName("rank")
            for(var rank of ranks){
                obj.stats_ranks.push({
                    name: ko.observable(rank.attributes["friendlyname"].value),
                    rank: ko.observable(rank.attributes["value"].value),
                    bayesavg: ko.observable(rank.attributes["bayesaverage"].value)
                })
            }
        }
        $("#loading").hide()
    })
}
buildSuggestedPlayerCounts = function(){
    suggested_player_counts = ko.observableArray([])
    for(var i=0; i<13; i++){
        suggested_player_counts.push({//foreach: poll>results
            numplayers: ko.observable(i), //results[numplayers]
            best_numvotes: ko.observable(0), //results[0][numvotes]
            best_percvotes: ko.observable(0), //results[0][numvotes]/results[numplayers]
            recommended_numvotes: ko.observable(0), //results[1][numvotes]
            recommended_percvotes: ko.observable(0), //results[1][numvotes]/results[numplayers]
            notrecommended_numvotes: ko.observable(0), //results[2][numvotes]
            notrecommended_percvotes: ko.observable(0), //results[2][numvotes]/results[numplayers]
        })
    }
    return suggested_player_counts
}
CollectionItem = function(item,username){
    this.owners = ko.observableArray([username])
    this.objectid = ko.observable(parseInt(item.attributes['objectid'].value)),
    this.subtype = ko.observable(item.attributes['subtype'].value),
    this.isBoardgame = ko.computed(() => this.subtype()=="boardgame",this),
    this.isExpansion = ko.computed(() => this.subtype()=="boardgameexpansion",this),
    this.name = ko.observable(item.getElementsByTagName('name')[0].textContent),
    this.yearpublished = ko.observable(parseInt(item.getElementsByTagName('yearpublished')[0].textContent)),
    this.image = ko.observable(item.getElementsByTagName('thumbnail')[0].textContent), //image
    this.status_own = ko.observable(item.getElementsByTagName('status')[0].attributes['own'].value=="1"),
    this.numplays = ko.observable(item.getElementsByTagName('numplays')[0].textContent),
    //Populated in 2nd call
    this.description = ko.observable(""), //description
    this.minplayers  = ko.observable(0), //minplayers
    this.maxplayers  = ko.observable(0), //maxplayers
    this.suggested_player_counts = buildSuggestedPlayerCounts(), //poll[name="suggested_numplayers"]
    this.minplaytime  = ko.observable(0), //minplaytime
    this.maxplaytime  = ko.observable(0), //maxplaytime
    this.categories = ko.observableArray([]), //link[type="boardgamecategory"]
    this.mechanics = ko.observableArray([]), //link[type="boardgamemechanic"]
    this.families = ko.observableArray([]), //link[type="boardgamefamily"]
    this.expansions = ko.observableArray([]), //link[type="boardgameexpansion"]
    this.expansion_ids = ko.observableArray([]),
    this.stats_rating_num = ko.observable(0), //statistics>ratings>userrated[value]
    this.stats_rating_avg = ko.observable(0), //statistics>ratings>average[value]
    this.stats_rating_bayesavg = ko.observable(0), //statistics>ratings>bayesaverage[value]
    this.stats_rating_std = ko.observable(0) //statistics>ratings>stddev[value]
    this.stats_weight_num = ko.observable(0) //statistics>ratings>numweights[value]
    this.stats_weight_avg = ko.observable(0) //statistics>ratings>averageweight[value]
    this.stats_ranks = ko.observableArray([]) //foreach: statistics>ratings>ranks>rank {name, value}
}
processCollection = function(username){
    return getCollection(username).then(
        onFulfilled=( data, textStatus, xhr ) => {
            // koModel.all_games([])
            // koModel.expansions([])
            ids = []
            let items = data.children[0].children
            for (var item of items){
                ci = new CollectionItem(item,username)
                isDuplicate = ci.objectid() in koModel.all_games_byid
                if(ci.status_own()){
                    if (!isDuplicate){
                        ids.push(ci.objectid())
                        koModel.all_games.push(ci)
                        koModel.all_games_byid[ci.objectid()] = ci
                    } else {
                        ci = koModel.all_games_byid[ci.objectid()]
                        if (!ci.owners().includes(username)){
                            ci.owners.push(username)
                        }
                    }
                }
            }
            return ids
        }
        ,onRejected = (textStatus, xhr) => {
            console.log("First Attempt not successful: "+xhr.status)
        }
    ).then(getThings) //https://api.geekdo.com/xmlapi2/thing?id=241451,180263&stats=1
}
loadData = function(){
    ko.options.deferUpdates = true
    koModel = new BGGModel()
    ko.applyBindings(koModel);

    setTimeout(function() {
        const urlParams = new URLSearchParams(window.location.search);
        let username = urlParams.get('name')
        if (username){
            koModel.username(username)
        }
    })
    //read arguments (username)
    //if username not empty, dispatch job
    
}
document.addEventListener("DOMContentLoaded", function(event) { 
    loadData()
});