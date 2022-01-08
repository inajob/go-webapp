// MCE Language
// Ver2

var Gin = require("./gin.js")
var MersenneTwister = require("./mt.js")

var MCL = function(){
  //==============================
  //   Parser
  //==============================
  this.parser = new Gin.Gin.Grammar({
    Stmnt: /Cmp:cmp | [!] ARG:push [=] Cmp:assign/,  // 代入演算、即値
    Cmp: / Expr ([<] Expr:gt | [>] Expr:lt | [==] Expr:eq | [!=] Expr:neq)* /,      // 比較演算
    Expr: / Term ([+] Term:add | [-] Term:sub)* /,   // 加減演算
    Term: / Fctr ([*] Fctr:mul | [/] Fctr:div | [%] Fctr:mod)* /, // 乗除演算
    // 数字、変数、関数、文字列、括弧
    Fctr: / $DECIMAL:fpush | Def | Call | $JS_STRING:push | [(] Cmp:pushn [)] /,
    // 変数、関数呼び出し[ブロック付き]
    Call: /(ARG:vpush|[(] Cmp[)]):callBegin (("(" ARGLIST{0,1} ")":prepareBlock (("{" PROGRAM "}"){0,1}):funcBody) {0,1}):funcCall/,
    // 関数定義
    Def: /[\\]:defBegin ("(" ARGLIST{0,1} ")":prepareBlock "{" PROGRAM "}":funcBody):funcDef/,

    // プログラム全行
    PROGRAM: /((LINE:line (<;>){0,1})*)/,
    LINE: /Stmnt COMM/, //ブロック解析
    COMM: /<(\/\/[^\r\n]*|)>/,            //コメント
    ARGLIST: /Stmnt:arg (',' ARGLIST){0,1}/, // 引数リスト
    ARG: /<[a-zA-Z][a-zA-Z0-9]*>/,      //識別子
  },"PROGRAM",  new Gin.Gin.Parser.RegExp(/[ \r\n]/));
  this.calcAction = {
    _stack: [],
    argList:[],
    varList:[],
    block:[[]],
    out:[],
    push: function (v) { this._stack.push(["imm", v + ""]); }, // 即値
    fpush: function (v) { this._stack.push(["imm", parseFloat(v + "")]); }, // 即値(数字）
    vpush: function (v) { this._stack.push(["variable", (v + "")]); }, // 変数
    pushn: function (v) {  }, //何もしない
    callBegin:function(v){ // 識別子オブジェクトを作成
      this.argList.push([]);
      this.varList.push(this._stack.pop());
    },
    defBegin:function(v){ // 識別子オブジェクトを作成
      this.argList.push([]);
    },
    funcCall: function(v){ // 識別子オブジェクトに 引数リストオブジェクトを突っ込む
      var l = this.argList.pop();
      if(v.length === 0){  // 識別子の後ろに引数リストがない場合は変数
        this._stack.push(this.varList.pop());
      }else{              // 引数リストがある場合は関数呼び出し
        var b = this._stack.pop();
        if(b === null){
          this._stack.push(["func",this.varList.pop(),l,[]]);
        }else{
          this._stack.push(["func",this.varList.pop(),l,b]);
        }
      }
    },
    funcDef: function(v){ // 識別子オブジェクトに 引数リストオブジェクトを突っ込む
      var l = this.argList.pop();
      var b = this._stack.pop();
      if(b === null){ // TODO: ここを通るケースがあるのか？
        this._stack.push(["def",l,[]]);
      }else{
        this._stack.push(["def",l,b]);
      }
    },
    prepareBlock:function(v){ // blockを入れるための空リストを用意
      this.block.push([]);
    },
    funcBody: function(v){ // 識別子オブジェクトに 関数ボディオブジェクトを突っ込む
      if(v.length === 0){  // Callの際 Bodyが無い場合がある
        this._stack.push(null); // Bodyは無いのでnullを入れる
        this.block.pop();
      }else{              // Bodyをひとまず_stackに入れる
        this._stack.push(this.block.pop());
      }
    },
    assign:function(v){ // 左辺値と 右辺値を取り出して 代入オブジェクトを作成
      var cmp = this._stack.pop();
      var vs = this._stack.pop();
      this._stack.push(["assign",vs,cmp]);
    },
    cmp:function(v){ // もうここでやることはない
      //var a = this._stack[this._stack.length - 1]; // TODO: 削除してよい
    },
    // 行オブジェクトの作成
    line: function(v){
      var tmp = this._stack.pop();
      this.block[this.block.length - 1].push(tmp);
    },
    // 引数リストの追加
    arg:function(v){
      this.argList[this.argList.length - 1].push(this._stack.pop());
    },
    // 二項演算オブジェクトの作成
    neq: function (v) {var r = this._stack.pop(), l = this._stack.pop(); this._stack.push(["neq",l,r]);},
    eq: function (v) {var r = this._stack.pop(), l = this._stack.pop(); this._stack.push(["eq",l,r]);},
    lt: function (v) {var r = this._stack.pop(), l = this._stack.pop(); this._stack.push(["lt",l,r]);},
    gt: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["gt",l,r]);},
    add: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["add",l,r]);},
    sub: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["sub",l,r]); },
    mul: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["mul",l,r]); },
    div: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["div",l,r]); },
    mod: function (v) {var r = this._stack.pop(), l = this._stack.pop();  this._stack.push(["mod",l,r]); },

  };
};
MCL.prototype = {
  preProcess:function(s){
    // プリプロセッサ
    // - コメントの除去
    // - インデントを`{` `}`に変換
    var l = s.split(/[\r\n]+/);
    var i, j;
    var count = 0;
    var stack = [0];
    var pre = 0;
    var out = "";
    for(i = 0; i < l.length; i ++){
      // 行頭コメント`//`はここで消す
      l[i] = l[i].replace(/^\s*\/\/.*$/,"");
      if(l[i].length === 0)continue;
      // インデントの数を数える
      count = 0;
      for(j = 0; j < l[i].length; j ++){
        if(l[i][j] === ' '){
          count ++;
        }else{
          break;
        }
      }
      pre = stack[stack.length - 1];
      if(pre === count){  // インデント幅が同じ
        // nothing to do
        out += l[i] + '\n';
      }else{ // インデント幅が異なる
        if(pre < count){ // インデントが深くなった時
          out += '{\n' + l[i] + '\n';
          stack.push(count);
        }else{  // インデントが浅くなった時
          while(stack.length > 0){
            stack.pop();
            out += '}\n';
            if(stack[stack.length - 1] === count){
              break;
            }
          }
          out += l[i] + '\n';
        }
      }
    }
    for(i = 0; i < stack.length - 1; i ++){
      out += '}';
    }
    return out;
  },
  parse:function(s){
    // ginのパーサーに通す
    this.calcAction.block = [[]];
    this.rawOut = this.parser.parse(s, this.calcAction)

    if(this.rawOut.full === false){ // パーサがすべてを解釈できない場合
      //var ss = "";
      //for(var x in this.rawOut){
      //  ss += x + ":" + this.rawOut[x] + "\n";
      //}
      throw new Error("syntax error before [" + s.slice(this.rawOut.lastIndex) + "]");
    }
    //console.log("src "+s)
    //console.log(this.rawOut)
    // パース済みブロックを返却する
    return this.calcAction.block;
  }
};

function Affine(){
  this.data=[[1,0,0],[0,1,0],[0,0,1]];
  if(arguments.length === 9){
    this.data = [
      [arguments[0],arguments[1],arguments[2]],
      [arguments[3],arguments[4],arguments[5]],
      [arguments[6],arguments[7],arguments[8]]
    ];
  }else if(arguments.length === 0){
  }else{
    throw new Error("arguments size error");
  }
}

// スコープを表現
var Scope = function(){
  this.body = {};
  this.next = null;
}

// Magical Circle Environemnt
var MCE = function(){
    this.mt = new MersenneTwister.MersenneTwister(0);
    this.date = new Date();
    this.scope = null; // Scopeの先頭（単方向リスト）
    this.externalVar = {}; // 外部変数
    this.externalVarRequest = {}; // 外部変数要求
    this.description = "";
    this.out = "";
};
MCE.prototype = {
  // 変数のスコープを作成
  createScope:function(){
    var prevScope = this.scope;
    this.scope = new Scope();
    this.scope.next = prevScope;
  },
  // 変数のスコープを破棄
  destroyScope:function(){
    if(this.scope === null){
      throw new Error("error no more scope");
    }
    this.scope = this.scope.next;
  },
  // 今のスタックに　名前、値を紐付ける
  bindVariable: function(name, value){
    this.scope.body[name] = value;
  },
  // スタックをあがっていってその名前の変数があれば値を紐付ける
  setVariable:function(name, value){
    var t = this.scope;
    while(t){
      if(t.body[name] !== undefined){
        t.body[name] = value;
        break;
      }
      t = t.next;
    }
    if(!t){
      // どこにもない場合はローカルにしてみる？
      this.scope.body[name] = value;
    }
  },
  // 変数の値の解決
  getVariable:function(name){
    var t = this.scope;
    while(t){
      if(t.body[name] !== undefined){
        return t.body[name];
      }
      t = t.next;
    }
    return undefined;
  },
  run:function(obj){
    this.out = "";
    this.extArgs = [];
    this.createScope();

    // ビルトイン関数の登録
    //                     ID        仮引数              処理本体 識別子
    this.setVariable('if',['builtin',[['variable','cond']],[],'if']);
    this.setVariable('blockif',['builtin',[['variable','cond']],[],'blockif']);
    this.setVariable('not',['builtin',[['variable','target']],[],'not']);
    this.setVariable('loop',['builtin',[['variable','max']],[],'loop']);
    this.setVariable('write',['builtin',[['variable','str']],[],'write']);
    this.setVariable('getExternalVar',['builtin',[['variable','label'],['variable','initial']],[],'getExternalVar']);
    this.setVariable('addDescription',['builtin',[['variable','type'],['variable','text']],[],'addDescription']);
    this.setVariable('eval',['builtin',[['variable','class'],['variable','method']],[],'eval']);
    this.setVariable('evalAllExtArgs',['builtin',[],[],'evalAllExtArgs']);
    this.setVariable('evalExtArg',['builtin',[['variable','n']],[],'evalExtArg']);
    this.setVariable('extArgsLength',['builtin',[],[],'extArgsLength']);
    this.setVariable('block',['builtin',[],[],'block']);
    var self = this;
    this.setVariable('rand',['builtin',[],[],'js', function(){return self.mt.next()}]);
    // ==== STRING ====
    this.setVariable('stringLength',['builtin',[['variable','str']],[],'js', function(){
      var s = self.getVariable('str');
      var n;
      if(s){ n = s.length; }
      return n;
    }]);
    this.setVariable('stringCharAt',['builtin',[['variable','str'],['variable','n']],[],'js', function(){
      return self.getVariable('str')[self.getVariable('n')];
    }]);

    // ==== DATE ====
    this.setVariable('dateGetFullYear',['builtin',[],[],'js', function(){
      return self.date.getFullYear();
    }]);
    this.setVariable('dateGetYear',['builtin',[],[],'js', function(){
      return self.date.getYear();
    }]);
    this.setVariable('dateGetMonth',['builtin',[],[],'js', function(){
      return self.date.getMonth();
    }]);
    this.setVariable('dateGetDay',['builtin',[],[],'js', function(){
      return self.date.getDay();
    }]);
    this.setVariable('dateGetHours',['builtin',[],[],'js', function(){
      return self.date.getHours();
    }]);
    this.setVariable('dateGetMinutes',['builtin',[],[],'js', function(){
      return self.date.getMinutes();
    }]);
    this.setVariable('dateGetSeconds',['builtin',[],[],'js', function(){
      return self.date.getSeconds();
    }]);

    // ==== ARRAY ====
    this.setVariable('arrayInit',['builtin',[],[],'js', function(){
      return [];
    }]);
    this.setVariable('arraySet',['builtin',[['variable','vname'],['variable','index'],['variable','target']],[],'js', function(){
      var arr = self.getVariable('vname');
      arr[self.getVariable('index')] = self.getVariable('target');
      return self.getVariable('target');
    }]);
    this.setVariable('arrayGet',['builtin',[['variable','vname'],['variable','index']],[],'js', function(){
      var arr = self.getVariable('vname');
      return arr[self.getVariable('index')];
    }]);
    this.setVariable('arrayCount',['builtin',[['variable','vname']],[],'js', function(){
      var arr = self.getVariable('vname');
      return arr.length;
    }]);
    this.setVariable('arrayPop',['builtin',[['variable','vname']],[],'js', function(){
      var arr = self.getVariable('vname');
      return arr.pop();
    }]);
    this.setVariable('arrayPush',['builtin',[['variable','vname'],['variable','target']],[],'js', function(){
      var arr = self.getVariable('vname');
      arr.push(self.getVariable('target'));
      return self.getVariable('target');
    }]);

    var ret;
    for(var i=0; i < obj.length; i ++){
      ret = this.execute(obj[i]);
    }
    this.destroyScope();
    return ret;
  },
  execute: function(obj){
    var ret;
    for(var i = 0; i < obj.length; i ++){
      if(this[obj[i][0]]){ // パーサー返却値の0番目は内部識別子が格納されている
        // 内部識別子名がそのままMCEのメソッド名となっている
        ret = this[obj[i][0]].apply(this,obj[i].slice(1));
      }else{
        throw new Error("unknown op-code [" + obj[i][0] + "]");
      }
    }
    return ret; // 最後の実行結果を返す
  },
  // 関数オブジェクト
  def: function(vArgList, block){
    // ユーザ定義関数の呼び出し
    var out;
    //    ID, 仮引数, 処理本体, 環境
    out = ['lambda', vArgList, block, this.scope];
    return out;
  },
  // 関数呼び出し
  func: function(obj, argList, extArgs){
    // 関数呼び出し関数そのものの評価
    // 組込み制御構文の処理もここ
    var l = this.execute([obj]);
    if(l===undefined){
      throw new Error("undefined function [" + obj[1] + "]");
    }
    var ret;

    var op = l[0];        // ID ( builtin | lambda )
    var vArgList = l[1];  // 仮引数
    var block = l[2];     // builtin:[], lambda:処理本体
    //l[3]; // builtin: builtin識別子 , lambda: scope

    // 先に引数を評価する
    var tmpArgList = [];
    for(var i = 0; i < argList.length; i ++){
      tmpArgList[i] = this.execute([argList[i]]);
    }

    // 現在のscopeを保存する
    var prevScope = this.scope;
    // これから使うscopeを用意する
    var nextScope = new Scope();

    // ユーザ定義関数は宣言されたスコープで実行する
    if(op === 'lambda'){
      nextScope.next = l[3]; // lambdaが持っているスコープをいまのscopeの一つ上に入れる
      this.scope = nextScope; // 先ほど作ったscopeを現在のscopeとする(このscopeは無駄な気がする）
    }

    this.createScope(); // 新しいscopeを作り今のscopeを一つ上に入れる

    // argList : 実引数
    // vArgList: 仮引数
    // memo: 可変引数を許可
    //if(argList.length != vArgList.length){
    //    throw "arg number mismatch";
    //}
    // このときは上のスコープまで上がらない（そのスコープに無いときは作る）
    for(let i = 0; i < vArgList.length; i ++){
      if(i < argList.length){
        this.bindVariable(vArgList[i][1], tmpArgList[i]);
      }else{
        this.bindVariable(vArgList[i][1], null); // 引数が足りていないとき
      }
    }
    if(op === 'builtin'){ // builtin or lambda
      var type = l[3];
      // ビルトイン関数 （あまり増やしたくない、 なるべくpreludeにいれよう）
      if(type === 'if'){
        if(this.getVariable('cond')){ // todo: condって名前考えよう(?)
          let tmpScope = this.scope;
          this.scope = this.scope.next; // 一つ上のscopeを現在のscopeとする（ifはscopeを持たないが、仕組み上作ってしまっているため + condだけが存在する）
          ret = this.execute(extArgs); // if blockを評価する
          this.scope = tmpScope;
        }
      }else if(type === 'blockif'){
        if(this.getVariable('cond')){ // todo: condって名前考えよう(?)
          // condがみえなくする
          let tmpScope = this.scope
          this.scope = this.scope.next; // 一つ上のscopeを現在のscopeとする（ifはscopeを持たないが、仕組み上作ってしまっているため + condだけが存在する）
          ret = this.execute(extArgs); // if blockを評価する TODO: なんかおかしい[extargs[0]]の間違いでは？
          this.scope = tmpScope;
        }else{
          // condがみえなくする
          var tmpScope = this.scope
          this.scope = this.scope.next;
          ret = this.execute([extArgs[1]]);
          this.scope = tmpScope;
        }
      }else if(type === 'not'){
        var target = this.getVariable('target'); // targetって名前を考えよう
        ret = (!target)?true:false;
      }else if(type === 'loop'){
        var max = this.getVariable('max');
        for(let i = 0; i < max; i ++){
          // maxがみえなくする
          let tmpScope = this.scope
          this.scope = this.scope.next; // 一つ上のscopeを現在のscopeとする（loopはscopeを持たないが、仕組み上作ってしまっているため + maxだけが存在する）
          ret = this.execute(extArgs); // loopのbodyを評価する
          this.scope = tmpScope;
        }
      }else if(type === 'block'){
        // letみたいな感じで変数を宣言
        for(let i = 0; i < argList.length; i ++){
          this.bindVariable(this.execute([argList[i]]), 0); //初期値は0
        }
        ret = this.execute(extArgs); // blockの本体を評価する
      }else if(type === 'addDescription'){
        let type = this.getVariable('type');
        let text = this.getVariable('text');

        function escapeHTML(val) {
          return val.replace(/<>/g);
        };
        switch(type){
          case 'h1':
            this.description += '<h1>' + escapeHTML(text) + '</h1>';
            break;
          case 'h2':
            this.description += '<h2>' + escapeHTML(text) + '</h2>';
            break;
          case 'h3':
            this.description += '<h3>' + escapeHTML(text) + '</h3>';
            break;

          default:
            this.description += escapeHTML(text) + '<br>';
        }
      }else if(type === 'getExternalVar'){ // MCEの外からの変数を取得する
        var label = this.getVariable('label');
        var initial = this.getVariable('initial');

        this.externalVarRequest[label] = {label:label, initial:initial};

        ret = this.externalVar[label];
      }else if(type === 'write'){ // 内部表現を出力する
        var str = this.getVariable('str'); // strって名前を考えよう
        this.out += str + '\n';
      }else if(type === 'eval'){ // JavaScriptの関数を実行する
        var vClass = this.getVariable('class');
        var vMethod = this.getVariable('method');
        // 可変長引数が扱いたい
        // argListを直に触ればok
        if(vClass === 'Math'){ // 今のところMathのみをサポート。これなら安全と判断。
          var tmp = argList.slice(2);
          // todo: この処理を何とかしたい
          for(let i = 0; i < tmp.length; i ++){
            tmp[i] = this.execute([tmp[i]]);
          }
          //throw (argList);
          ret = Math[vMethod].apply(Math, tmp);
        }else{
          throw new Error("not support class :" + vClass);
        }

      }else if(type === 'evalAllExtArgs'){ // lambda実行時にくっついているblock(extArgs)をすべて評価する
        // targetのscopeを合わせる
        // 最後に評価したlambdaを取り出す
        let target = this.extArgs.pop(); // TODO: popしているのが解せない・・
        // extArgsを処理するときは 上の関数のextArgsが見えるように一度popする (不要かも）

        // scopeを待避させる
        let tmpScope = this.scope;
        // extArgsのscopeを現在のscopeとする
        this.scope = target.scope;

        // extArgsのbodyを評価する
        ret = this.execute( target.body );
        // scopeを元に戻す
        this.scope = tmpScope;
        this.extArgs.push(target);

      }else if(type === 'evalExtArg'){
        var n = this.getVariable('n');

        let target = this.extArgs.pop();
        // extArgsを処理するときは 上の関数のextArgsが見えるように一度popする (不要かも)

        // scopeを待避させる
        let tmpScope = this.scope;
        // extArgsのscopeを現在のscopeとする
        this.scope = target.scope;

        ret = this.execute( [target.body[n]] );
        // scopeを元に戻す
        this.scope = tmpScope;

        this.extArgs.push(target);

      }else if(type === 'extArgsLength'){
        let target = this.extArgs.pop();
        // extArgsを処理するときは 上の関数のextArgsが見えるように一度popする
        ret = target.body.length;
        this.extArgs.push(target);
      }else if(type === 'js'){
        var f = l[4];
        ret = f();
      }else{
        throw new Error("unknwon builtin :" + type);
      }
    }else{ // lambda
      // ユーザ定義関数の実行
      // lambdaがcallされたときそれにぶら下がっているblock（extArgs）はデフォルトでは評価されない
      // 評価するときのためにここでスタックに入れておく
      this.extArgs.push({body:extArgs, scope:prevScope});
      ret = this.execute(block); // 再起するとここがかさみそう
      // lambdaの実行が終わるとextArgsは不要
      this.extArgs.pop();
    }

    this.destroyScope();
    this.scope = prevScope; // 折角destroyScopeしているのにここでprevScopeに戻してしまうのはちょっとおかしい

    return ret;
  },
  imm:function(n){
    return n;
  },
  variable:function(id){
    return this.getVariable(id);
  },
  assign:function(left, right){
    return this.setVariable(this.execute([left]), this.execute([right]));
  },
  neq:  function(left, right){return this.execute([left]) !== this.execute([right]);},
  eq:  function(left, right){return this.execute([left]) === this.execute([right]);},
  lt:  function(left, right){return this.execute([left]) > this.execute([right]);},
  gt:  function(left, right){return this.execute([left]) < this.execute([right]);},
  add: function(left, right){return this.execute([left]) + this.execute([right]);},
  sub: function(left, right){return this.execute([left]) - this.execute([right]);},
  mul: function(left, right){return this.execute([left]) * this.execute([right]);},
  div: function(left, right){return this.execute([left]) / this.execute([right]);},
  mod: function(left, right){return this.execute([left]) % this.execute([right]);}
};
/*
function dump(ar,depth){
    var dumpStr = "";
    if(depth === 0 )dumpStr = "";
    var i = 0;
    for(i = 0; i < ar.length; i++){
        if(ar[i] instanceof Array){
            dumpStr += '[';
            dump(ar[i], depth + 1);
            dumpStr += ']';
        }else{
            dumpStr += ar[i];
        }
        if(i != ar.length - 1){
            dumpStr += ',';
        }
    }
    return dumpStr;
}
*/

module.exports = {
  MCL: MCL,
  MCE: MCE,
  Affine: Affine,
}

/*
var mcl = new MCL();
var o = mcl.parse("2*3 + 5*2;");
console.log(o);
console.log(mcl.calcAction);
dump(mcl.calcAction.block,0);
console.log(dumpStr);

var mce = new MCE();
var ret = mce.execute(mcl.calcAction.block);
console.log(ret);
*/
