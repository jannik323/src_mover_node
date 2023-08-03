const fetch = require('node-fetch');

let category,newcategory,level,newlevel,apikey;
let haslevel = false;

let runcount = 1;
let initoffset = 0;

let maxruns = 1;

let variKey,variValue;
let hasVari = false;

let movingComplete = false;

let inptstate = 0;

let totalMovedRuns = 0;

process.stdout.write("Please enter the maximum amount of runs which you want to move (leave blank for none) : ");

process.stdin.on("data",(data)=>{
    data=data||"";
    data = data.toString().replace(/[\n\r ]/g, '');
    switch(inptstate){
        case 0:
            if(data==""){
                runcount=999999999;
            }else{
                runcount=Math.max(1,new Number(data)); // min 1
            }
            maxruns = Math.min(200,runcount);
            process.stdout.write("\n(If you left off at a point and want to continue there)");
            process.stdout.write("\nPlease enter the offset amount (leave blank for none) : ");
            break;
        case 1:
            if(data!=""){
                initoffset=Math.max(0,new Number(data)); // min 0
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
            process.stdout.write("\n\ncategory: "+category+"\n  new category: "+newcategory+"\nvariable key: "+variKey+"\nvariable value: "+variValue+"\nlevel: "+level+"\n  new level: "+newlevel+"\nApi-key: "+apikey+"\nmaximum runs moved: "+runcount+"\ninitial offset: "+initoffset+"\n ");
            process.stdout.write("\nIs this right ? (y/n): \n");
            break;
        case 9:
            if(data=="y"){
                process.stdout.write("starting!\n");
                if(!(category&&newcategory)){
                    process.stdout.write("\nProgram has been stopped. You didnt fill out the category goal and or orgin , silly");
                    process.exit(1);
                };
                startMovingCategory();
            }else{
                process.stdout.write("\nOkay.....Be sure to enter it right this time...");
                inptstate=0;
                hasVari = false;
                haslevel = false;
                process.stdout.write("\nPlease enter the maximum amount of runs which you want to move (leave blank for none) :");
                return;
            }
    }
    inptstate++;
})

async function startMovingCategory(){
    for (let offset = 0; offset < runcount; offset+=200) {
        await moveCategoryPortion(offset);        
        console.log("finished moving runs at offset "+ (initoffset+offset));
        if(movingComplete){
            break;
        }
    }
    console.log("finished moving the category");
    console.log("a total of "+totalMovedRuns+ " run were moved");
    process.exit(0);
}

function moveCategoryPortion(offset){
    return pullruns(offset)
    .then(res=>{
        console.log("pulled "+res.pagination.size+ " runs with offset of "+(initoffset+offset));
        if(res.pagination.size<200){
            movingComplete=true;
        }
        return filterCatJSON(res)
    })
    .then(res=>{
        console.log("filtered all data");
        return postcats(res);
    })
    .catch(err=>{console.log(err)})
}

function pullruns(offset){

    let Url;
    if(haslevel){
         Url=`https://www.speedrun.com/api/v1/runs?category=${category}&level=${level}&max=${maxruns}&status=verified&offset=${initoffset+offset}`;
    }else{
        Url =`https://www.speedrun.com/api/v1/runs?category=${category}&max=${maxruns}&status=verified&offset=${initoffset+offset}`;
    }
    
    return fetch(Url)
    .then(data=>data.json());
}

function filterCatJSON(catjson){
    if(hasVari){
        catjson.data = catjson.data.filter(run=>{
            return run.values[variKey]==variValue;
        });
        console.log("filtered data length is now "+catjson.data.length);
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
        if(run.videos&&run.videos.links){run.video = run.videos.links[0].uri}
        if(!run.comment){delete run.comment}
        if(run.splits){run.splitsio = run.splits.uri}
        // run.variables = {};
        // for(var name in run.values) {
        //     run.variables[name] = {};
        //     run.variables[name].value = run.values[name];
        //     run.variables[name].type = "pre-defined";
        // }
        delete run.values;
        delete run.submitted;
        delete run.id;
        delete run.links;
        delete run.videos;
        delete run.status;
        delete run.system;
        delete run.splits;
        delete run.times.primary;
        delete run.times.ingame_t;
        delete run.times.realtime_t;
        delete run.times.realtime_noloads_t;
        delete run.game;
    });

    return catjson;
}

function delay(delaytime){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delaytime);
    });
}

async function postcats(catjson) {
    for (let i = 0; i < catjson.data.length; i++) {
        console.log("posting request " + i + ",orgin url : "+catjson.data[i].weblink);
        delete catjson.data[i].weblink;
        await postcat(catjson.data[i]);
        await delay(1000);
    }
}

function postcat(data){

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

    return fetch(Url,para)
    .then(res=>{
        if(res.status == 200){
            console.log("succesfully posted request");
            totalMovedRuns++;
        }else{
            console.log("error while posting request : "+res.status+ " - "+ res.statusText);
        }
    })
    .catch(error=>{
        console.log(error);
    });
}

