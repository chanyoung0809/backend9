const express = require("express");
const MongoClient = require("mongodb").MongoClient;
//데이터베이스의 데이터 입력,출력을 위한 함수명령어 불러들이는 작업
const app = express();
const port = 3000;

//ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
//사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
app.use(express.json()) 
//css/img/js(정적인 파일)사용하려면 이코드를 작성!
app.use(express.static('public'));


let db; //데이터베이스 연결을 위한 변수세팅(변수의 이름은 자유롭게 지어도 됨)

MongoClient.connect("mongodb+srv://cisalive:cisaliveS2@cluster0.cjlsn98.mongodb.net/?retryWrites=true&w=majority",(err,result)=>{
    //에러가 발생했을경우 메세지 출력(선택사항)
    if(err) { return console.log(err); }

    //위에서 만든 db변수에 최종연결 ()안에는 mongodb atlas 사이트에서 생성한 데이터베이스 이름
    db = result.db("board_final");

    //db연결이 제대로 됬다면 서버실행
    app.listen(port,()=>{
        console.log("서버연결 성공");
    });

});

app.get("/",function(req,res){
    res.render("index.ejs");
});

//게시글 목록 페이지
app.get("/board/list",(req,res)=>{
   
    db.collection("board").find().toArray((err,total)=>{
        // 게시글 전체 갯수값 알아내서 변수로 저장
        let totalData = total.length;
        // 사용자(홈페이지에 접속한 사람)가 웹브라우저 주소창에 몇 번 페이징 번호로 접속했는지 체크
        // 기본 접속 시에는 page=1로 고정
        console.log(`전체 게시글 갯수 ${totalData}`);

        // 페이지 번호가 공란일 때(잘못된 값일 때) ? 1로고정 : 받은 페이지값을 숫자로
        let pageNumber = (req.query.page == null) ? 1 : Number(req.query.page);
        console.log(`현재 보고있는 페이지 번호 ${pageNumber}`);

        // 한 페이지에 보여줄 게시글 갯수 설정
        let perPage = 6;

        // 페이지 번호들이 뭉쳐있는 걸 pagingblock이라고 함
        // 갯수 조정 가능 <이전 [6 7 8 9 10] 다음>
        // 블록당 보여줄 페이징 번호 갯수값 설정
        let blockCount = 3;
        // 이전, 다음 블록 간 이동 하기 위한 현재 페이지 블록 구하기
        //  각 페이지번호를 블록당 페이지 번호 갯수값으로 나눈 값을 올림하면 pagenumber 1번부터 blockcount번까지는 1, blockCount +1번부터 blockcount*2번까지는 2...
        let blockNum = Math.ceil(pageNumber / blockCount);
        console.log(`페이징블록의 순번값 ${blockNum}`);

        // 블록 안 페이지 번호 시작값 알아내기 (1) 2 3 4 5
        let blockStart = ((blockNum -1) * blockCount) + 1;
        // 블록 안 페이지 번호 끝값 알아내기 1 2 3 4 (5)
        let blockEnd =  blockStart + blockCount -1;
        console.log(`${blockNum}번째 시작하는 페이지번호는 ${blockStart}, 끝나는 페이지번호는 ${blockEnd}`);

        // 게시글 전체 갯수를 토대로 전체 페이지 번호가 총 몇 개 만들어져서 표시돼야하는지?
        let totalPaging = Math.ceil(totalData/perPage);

        // 블록(그룹)에서 마지막 페이지 번호가 끝 번호보다 크다면 페이지의 끝번호를 강제로 고정시킴(잘못된 접근 막기 위해)
        if(blockEnd > totalPaging){
            blockEnd = totalPaging;
            // 끝번호 7인데, 10번 페이지를 보려고 한다면 7로 고정시킴
        }
        

        // 페이징블록(그룹)의 총 갯수값 구하기
        let totalBlock = Math.ceil(totalPaging / blockCount);

        // db에서 게시글 뽑아서 가져오기 위한 순서값(몇 번째부터 가져올 것인가?) 정해주기(페이지번호 1 - 20, 19, 18. 2 - 17, 16, 15...)
        // 게시글 번호는 1번부터 시작해도, 배열은 0부터 시작임
        let startFrom = (pageNumber - 1) * perPage;

        /* db에서 find 명령어로 꺼내오는 작업 */
        db.collection("board").find().sort({num:-1}).skip(startFrom).limit(perPage).toArray((err,result)=>{
            res.render("brd_list.ejs", {
                data:result, // find로 찾아온 게시글 데이터들
                totalPaging:totalPaging, // 페이지 번호 총 갯수값 -> 7개
                blockStart:blockStart, // 블록 안의 페이지 시작 번호값
                blockEnd:blockEnd, // 블록 안의 페이지 끝 번호값
                blockNum:blockNum, // 보고있는 페이지 번호가 몇 번 블록(그룹번호)에 있는지 확인
                totalBlock:totalBlock, // 블록(그룹)의 총 갯수 -> 2개
                pageNumber:pageNumber // 현재 보고있는 페이지 값
            })
        })
    })
})

/* find 명령어에 새롭게 추가될 옵션 테스트 */
// app.get("/test", (req, res)=>{
//     db.collection("board").find().sort({num:-1}).skip(6).limit(3).toArray((err,result)=>{
//         console.log(result);
//     })
//     // skip(n) <- 배열의 몇 번째부터 가져올 거냐?
//     // limit(n) <- 몇 개 갖고 올 거냐?  
// })

//게시글 작성화면 페이지
app.get("/board/insert",(req,res)=>{
    res.render("brd_insert.ejs");
})


//게시글 데이터베이스에 저장
                
app.post("/dbupload",(req,res)=>{
   
    db.collection("count").findOne({name:"상품갯수"},(err,countResult)=>{
        db.collection("board").insertOne({
            num:countResult.prdCount,
            title:req.body.title,
            author:req.body.author,
            content:req.body.content
        },(err,result)=>{
            db.collection("count").updateOne({name:"상품갯수"},{$inc:{prdCount:1}},(err,result)=>{
                res.redirect(`/board/detail/${countResult.prdCount}`)
            })
        })
    })
})


//게시글 상세화면페이지
app.get("/board/detail/:num",(req,res)=>{

    db.collection("board").findOne({num:Number(req.params.num)},(err,result)=>{
        res.render("brd_detail.ejs",{data:result});
    })
})


//게시글 수정화면 페이지 요청
app.get("/board/update/:num",(req,res)=>{
    db.collection("board").findOne({num:Number(req.params.num)},(err,result)=>{

        res.render("brd_update.ejs",{data:result});
    })
})


//게시글 데이터베이스에 수정처리
app.post("/dbupdate",(req,res)=>{
    db.collection("board").updateOne({num:Number(req.body.num)},{$set:{title:req.body.title,author:req.body.author,content:req.body.content}},(err,result)=>{
        res.redirect(`/board/detail/${req.body.num}`) 
    })
})










