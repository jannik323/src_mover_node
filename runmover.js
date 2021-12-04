const fetch = require('node-fetch');

let category,newcategory,level,newlevel,apikey;
let haslevel = false;
let runcount = 100;
let inptstate = 0;

process.stdout.write("A maximum of "+ runcount+ " runs will be moved. To change this edit it in the source code.")
process.stdout.write("\nPlease enter the category, from which you pull the runs : ");

process.stdin.on("data",(data)=>{
    switch(inptstate){
        case 0:
            process.stdout.write("\nPlease enter the level, from which you pull the runs (leave blank for none) : ");
            category=data;
            inptstate++;
            break;
        case 1:
            process.stdout.write("\nPlease enter the new category, where you want to push the runs : ");
            level=data||"";
            inptstate++;
            break;
        case 2:
            process.stdout.write("\nPlease enter the new level, where you want to push the runs (leave blank for none): ");
            newcategory=data||"";
            inptstate++;
            break;
        case 3:
            process.stdout.write("\nPlease enter your Api key (Never share or enter your Api key to sources you dont trust): ");
            newlevel=data||"";
            inptstate++;
            break;
        case 4:
            apikey=data||"";
            process.stdout.write("\n\ncategory: "+category+"\n"+"new category: "+newcategory+"\n"+"level: "+level+"\n"+"new level: "+newlevel+"\n"+"Api-key: "+apikey+"\n");
            process.stdout.write("\nIs this right ? (y/n): \n");
            inptstate++;
            break;
        case 5:
            if(data=="y"){
                process.stdout.write("Ok, the process of moving all runs will now start.\n");
                pullruns();
            }else{
                process.stdout.write("Program has been stopped. Restart it to try again.");
                process.exit(1);
            }

    }
})
function pullruns(){

    if(!(category&&newcategory)){return;}
    let Url;
    if(level&&newlevel){
         Url=`https://www.speedrun.com/api/v1/runs?category=${category}&level=${level}&max=${runcount}&status=verified`;
         haslevel = true;
    }else{

        Url =`https://www.speedrun.com/api/v1/runs?category=${category}&max=${runcount}&status=verified `;
    }
    
    fetch(Url)
    .then(data=>{return data.json()})
    .then(res=>{changecatjson(res)})
    .catch(err=>{console.log(err)})

}

function changecatjson(catjson){ // meow ^w^

    catjson.data.forEach(run => {
        
        run.category = newcategory;
        (haslevel)?run.level=newlevel:delete run.level;
        if(!run.data){delete run.data}
        if(run.system.region){run.region = run.system.region}
        if(run.system.platform){run.platform = run.system.platform}
        run.verified=true;
        run.times.realtime =run.times.realtime_t;
        run.times.ingame =run.times.ingame_t;
        run.times.realtime_noloads =run.times.realtime_noloads_t;
        run.players.forEach(p=>{delete p.uri});
        run.emulated = run.system.emulated;
        if(run.videos){run.video = run.videos.links[0].uri}
        if(!run.comment){delete run.comment}
        if(run.splits){run.splitsio = run.splits.uri}
        for(var name in run.values) {
            run.variables[name].value = run.values[name];
            run.variables[name].type = "pre-defined"; // as of now all variables are hardcoded as pre-definied.
                                                    // It might cause some problems if you actually have "player defined" variables in your category.
        }

        //delete timeeee
        delete run.values;
        delete run.submitted;
        delete run.id;
        delete run.links;
        delete run.videos;
        delete run.status;
        delete run.system;
        delete run.weblink;
        delete run.splits;
        delete run.times.primary;
        delete run.times.ingame_t;
        delete run.times.realtime_t;
        delete run.times.realtime_noloads_t;
        delete run.game;
    });

    
    let index = 0;
    let postint = setInterval(()=>{
        console.log("posting request"+ index)
        postnewcategories(catjson.data[index]);
        if(index>=catjson.pagination.size-1){
            console.log("reached end at "+ index);
            clearInterval(postint);
            process.exit(0);
        }
        index++;
    },Math.round((catjson.pagination.size*1000)/50))

}



function postnewcategories(data){

    const Url = "https://www.speedrun.com/api/v1/runs";
    const Data = JSON.stringify({run:data});
    const para = {
        headers:{
            "Content-Type":"application/json",
            "X-API-Key":apikey,
        },
        body:Data,
        method:"POST"
    };

    fetch(Url,para)
    .then(res=>{console.log(res)})
    .catch(error=>{console.log(error)});


}

