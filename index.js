const fetch = require('node-fetch');

let category,newcategory,level,newlevel,apikey;
let haslevel = false;
let runcount = 1;
let offset = 0;

let variKey,variValue;
let hasVari = false;

let inptstate = 0;

process.stdout.write("Please enter the maximum amount of runs which you want to move : ");

process.stdin.on("data",(data)=>{
    data=data||"";
    data = data.toString().replace(/[\n\r ]/g, '');
    switch(inptstate){
        case 0:
            runcount=Math.min(200,Math.max(1,new Number(data))); // min 1 max 100
            process.stdout.write("\n(If you need to move more than 200 runs per category, you need to divide the category moving into chunks of 200.The offset is the previously moved amount of runs.)");
            process.stdout.write("\nPlease enter the offset amount (leave blank for none) : ");
            break;
        case 1:
            if(data!=""){
                offset=Math.max(0,new Number(data)); // min 0
            }
            process.stdout.write("\nPlease enter the category, from which you pull the runs : ");
            break;
        case 2:
            category=data;
            process.stdout.write("\nPlease enter the new category, where you want to push the runs : ");
            break;
        case 3:
            newcategory=data;
            process.stdout.write("\nPlease enter variable key, from which you pull the runs (leave blank for none) : ");
            break;
        case 4:
            if(data==""){
                inptstate = 6;
                variKey="";
                variValue="";
                process.stdout.write("\nPlease enter the level, from which you pull the runs (leave blank for none) : ");
                return;
            }
            hasVari = true;
            variKey=data;
            process.stdout.write("\nPlease enter the variable value, from which you pull the runs (leave blank for none) : ");
            break;
        case 5:
            variValue=data;
            process.stdout.write("\nPlease enter the level, from which you pull the runs (leave blank for none) : ");
            break;
        case 6:
            if(data==""){
                inptstate = 8;
                level="";
                newlevel="";
                process.stdout.write("\nPlease enter your Api key (Never share or enter your Api key to sources you dont trust): ");
                return;
            }
            haslevel = true;
            level=data;
            process.stdout.write("\nPlease enter the new level, where you want to push the runs (leave blank for none): ");
            break;
        case 7:
            newlevel=data;
            process.stdout.write("\nPlease enter your Api key (Never share or enter your Api key to sources you dont trust): ");
            break;
        case 8:
            apikey=data;
            process.stdout.write("\n\ncategory: "+category+"\n  new category: "+newcategory+"\nlevel: "+level+"\n  new level: "+newlevel+"\nApi-key: "+apikey+"\nmaximum runs moved: "+runcount+"\noffset: "+offset+"\n ");
            process.stdout.write("\nIs this right ? (y/n): \n");
            break;
        case 9:
            if(data=="y"){
                process.stdout.write("Ok, the process of moving all runs will now start.\n");
                pullruns();
            }else{
                process.stdout.write("\nOkay.....Be sure to enter it right this time...");
                inptstate=0;
                hasVari = false;
                haslevel = false;
                process.stdout.write("\nPlease enter the maximum amount of runs which you want to move : ");
                return;
            }

    }
    inptstate++;
})

function pullruns(){

    if(!(category&&newcategory)){
        process.stdout.write("\nProgram has been stopped. You didnt fill out the category goal and or orgin , silly");
        process.exit(1);
    };

    let Url;
    if(haslevel){
         Url=`https://www.speedrun.com/api/v1/runs?category=${category}&level=${level}&max=${runcount}&status=verified&offset=${offset}`;
    }else{
        Url =`https://www.speedrun.com/api/v1/runs?category=${category}&max=${runcount}&status=verified&offset=${offset}`;
    }
    
    fetch(Url)
    .then(data=>{return data.json()})
    .then(res=>{changecatjson(res)})
    .catch(err=>{console.log(err)})

}

function changecatjson(catjson){
    if(hasVari){
        catjson.data = catjson.data.filter(run=>{
            return run.values[variKey]==variValue;
        });
    }

    catjson.data.forEach(run => {
        run.category = newcategory;
        haslevel?run.level = newlevel:delete run.level;
        if(!run.date){delete run.date}
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
        run.variables = {};
        for(var name in run.values) {
            run.variables[name] = {};
            run.variables[name].value = run.values[name];
            run.variables[name].type = "pre-defined";
        }
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


    console.log(catjson.data);
    // postcats(catjson); //meow? 
}

function postcats(catjson) {
    let index = 0;

    let postint = setInterval(() => {
        console.log("posting request" + index);
        let isfinal = false;
        if (index >= catjson.pagination.size - 1) {
            console.log("reached end at " + index);
            clearInterval(postint);
            isfinal = true;
        }
        postcat(catjson.data[index],isfinal);
        index++;
    }, Math.round((catjson.pagination.size * 1100) / 60));
}

function postcat(data,final){

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
    .then(res=>{
        console.log(res);
        if(final){
            process.exit();
        }
    })
    .catch(error=>{console.log(error)});


}

