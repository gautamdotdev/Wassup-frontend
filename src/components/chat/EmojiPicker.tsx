import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

/* ─── Emoji database ─────────────────────────────────────────────────────── */
// Each entry: [emoji, name, ...keywords]
type EmojiEntry = { emoji: string; name: string; tags: string[] };

const RAW: [string, string, ...string[]][] = [
  // ── Smileys & emotion ──────────────────────────────────────────────────
  ["😀","grinning","smile","happy","joy","laugh"],
  ["😃","smiley","smile","happy","open mouth"],
  ["😄","smile","happy","laugh","joy","grin"],
  ["😁","beaming","grin","happy","teeth"],
  ["😆","laughing","happy","haha","xd","lol"],
  ["😅","sweat smile","nervous","laugh","relief"],
  ["🤣","rolling on floor laughing","rofl","lol","haha","cry laugh"],
  ["😂","joy","tears","laugh","haha","lol","cry","funny"],
  ["🙂","slightly smiling","smile","calm","mild"],
  ["🙃","upside down","silly","irony","sarcasm"],
  ["😉","winking","wink","flirt","hint","playful"],
  ["😊","blush","smile","happy","warm","cute"],
  ["😇","innocent","angel","halo","pure","good"],
  ["🥰","smiling with hearts","love","adore","crush","hearts"],
  ["😍","heart eyes","love","smitten","crush","adore"],
  ["🤩","star struck","wow","amazing","celebrity","excited"],
  ["😘","kissing heart","kiss","love","blow kiss","affection"],
  ["😗","kissing","kiss","pout"],
  ["😚","kissing closed eyes","kiss","love"],
  ["😙","kissing smiling eyes","kiss","smile"],
  ["🥲","smiling through tears","bittersweet","sad happy","relief"],
  ["😋","yum","food","tasty","delicious","tongue"],
  ["😛","tongue","silly","playful","tease"],
  ["😜","winking tongue","playful","wink","silly","tease"],
  ["🤪","zany","crazy","wild","silly","wacky"],
  ["😝","squinting tongue","silly","yuck","gross"],
  ["🤑","money mouth","rich","money","greedy","cash"],
  ["🤗","hugging","hug","embrace","warm","cuddle"],
  ["🤭","hand over mouth","oops","secret","giggle","shh"],
  ["🤫","shushing","quiet","secret","shhh","hush"],
  ["🤔","thinking","hmm","ponder","consider","wonder"],
  ["🤐","zipper mouth","silent","secret","zip","sealed"],
  ["🤨","raised eyebrow","skeptical","suspicious","really","doubt"],
  ["😐","neutral","blank","no expression","meh"],
  ["😑","expressionless","blank","no emotion","deadpan"],
  ["😶","no mouth","silent","speechless","mute"],
  ["😏","smirking","smirk","sly","confident","flirt"],
  ["😒","unamused","unimpressed","bored","meh","annoyed"],
  ["🙄","rolling eyes","eye roll","annoyed","whatever","bored"],
  ["😬","grimace","awkward","nervous","teeth","cringe"],
  ["🤥","lying","pinocchio","liar","nose"],
  ["😔","pensive","sad","thoughtful","gloomy","downcast"],
  ["😪","sleepy","tired","drowsy","sleep"],
  ["🤤","drooling","food","hungry","desire"],
  ["😴","sleeping","sleep","zzz","tired","night"],
  ["😷","mask","sick","covid","ill","medical"],
  ["🤒","thermometer face","sick","fever","ill","cold"],
  ["🤕","bandage","hurt","injured","pain","ow"],
  ["🤢","nauseated","sick","gross","vomit","green"],
  ["🤮","vomiting","puke","sick","gross","barf"],
  ["🤧","sneezing","cold","sick","achoo","tissues"],
  ["🥵","hot face","overheated","sweaty","hot","burning"],
  ["🥶","cold face","freezing","chilly","ice","shiver"],
  ["🥴","woozy","drunk","dizzy","tipsy","confused"],
  ["😵","dizzy face","stars","confused","knocked out"],
  ["🤯","exploding head","mind blown","shocked","wow","amazing"],
  ["🤠","cowboy","western","yeehaw","hat","country"],
  ["🥳","partying","party","celebrate","birthday","fun"],
  ["🥸","disguised","disguise","glasses","mustache","incognito"],
  ["😎","cool","sunglasses","awesome","chill","stylish"],
  ["🤓","nerd","glasses","geek","brainy","smart"],
  ["🧐","monocle","curious","inspect","detective","fancy"],
  ["😕","confused","uncertain","puzzled","unsure","worried"],
  ["😟","worried","anxious","concern","nervous","scared"],
  ["🙁","slightly frowning","sad","unhappy","disappointed"],
  ["☹️","frowning","sad","unhappy","frown"],
  ["😮","open mouth","surprised","wow","gasp","shocked"],
  ["😯","hushed","surprised","speechless","stunned"],
  ["😲","astonished","shocked","surprised","wow","amazed"],
  ["😳","flushed","embarrassed","shocked","surprised","red face"],
  ["🥺","pleading","cute","puppy eyes","beg","please","aww"],
  ["😦","frowning open mouth","sad","worried","shocked"],
  ["😧","anguished","pain","shocked","horror","distressed"],
  ["😨","fearful","scared","fear","horror","fright"],
  ["😰","anxious","sweat","nervous","worried","dread"],
  ["😥","sad","relieved","disappointed","sigh"],
  ["😢","crying","sad","tear","upset","sob","weep"],
  ["😭","loudly crying","sob","sad","bawl","tears","devastated"],
  ["😱","screaming","fear","horror","shocked","scream","scared"],
  ["😖","confounded","frustrated","confused","upset"],
  ["😣","persevering","struggling","effort","frustrated"],
  ["😞","disappointed","sad","let down","unhappy","dejected"],
  ["😓","downcast","sweat","hard","difficult","sigh"],
  ["😩","weary","tired","sad","exhausted","frustrated"],
  ["😫","tired","exhausted","weary","worn out","stressed"],
  ["🥱","yawning","tired","bored","sleepy","yawn"],
  ["😤","steam","frustrated","angry","determined","huffing"],
  ["😡","pouting","angry","mad","furious","rage","red"],
  ["😠","angry","mad","annoyed","cross","upset"],
  ["🤬","swearing","cursing","angry","rage","symbols"],
  ["😈","smiling devil","evil","mischief","naughty","devil","bad"],
  ["👿","angry devil","evil","devil","bad","dark"],
  ["💀","skull","death","dead","bones","halloween","scary"],
  ["☠️","skull crossbones","death","poison","pirate","danger"],
  ["💩","poop","shit","crap","funny","brown"],
  ["🤡","clown","funny","circus","creepy","joker"],
  ["👹","ogre","monster","japanese","scary","demon"],
  ["👺","goblin","monster","japanese","scary","red"],
  ["👻","ghost","halloween","boo","spooky","spirit"],
  ["👽","alien","ufo","extraterrestrial","space","weird"],
  ["👾","alien monster","game","arcade","space invader","pixel"],
  ["🤖","robot","machine","bot","ai","technology"],

  // ── Hand gestures ──────────────────────────────────────────────────────
  ["👍","thumbs up","like","approve","yes","good","okay","great"],
  ["👎","thumbs down","dislike","no","disapprove","bad"],
  ["✊","raised fist","power","strength","resist","solidarity"],
  ["👊","oncoming fist","punch","fist bump","fight"],
  ["🤛","left facing fist","fist bump","left","solidarity"],
  ["🤜","right facing fist","fist bump","right","solidarity"],
  ["🤞","crossed fingers","luck","hope","fingers crossed","wish"],
  ["✌️","victory","peace","two","v sign","win"],
  ["🤟","love you","ily","rock","sign language"],
  ["🤘","horns","rock","sign","metal","cool"],
  ["🤙","call","phone","hang loose","shaka","aloha"],
  ["👈","pointing left","left","this","here","direction"],
  ["👉","pointing right","right","this","here","direction"],
  ["👆","pointing up","up","above","direction"],
  ["🖕","middle finger","rude","offensive","anger"],
  ["👇","pointing down","down","below","direction"],
  ["☝️","index pointing up","one","first","attention"],
  ["👋","waving","wave","hello","goodbye","hi","bye"],
  ["🤚","raised back of hand","stop","hello","high five"],
  ["🖐️","hand splayed","stop","five","high five","hello"],
  ["✋","raised hand","stop","high five","hello","halt"],
  ["🖖","vulcan salute","star trek","spock","live long","prosper"],
  ["👌","ok","okay","perfect","fine","good"],
  ["🤌","pinched fingers","italian","perfect","chef kiss"],
  ["✌️","peace","victory","two","v"],
  ["🤏","pinching hand","little","small","tiny","squeeze"],
  ["👏","clapping","applause","clap","bravo","congrats"],
  ["🙌","raising hands","celebrate","yay","hooray","praise"],
  ["🤲","open hands","cup","prayer","offer","request"],
  ["🤝","handshake","deal","agreement","partner","greeting"],
  ["🙏","folded hands","pray","please","thanks","namaste","worship"],
  ["✍️","writing","pen","write","sign","author"],
  ["💅","nail polish","manicure","beauty","sassy","nails"],
  ["💪","flexed biceps","strong","muscle","gym","workout","power"],

  // ── Hearts & symbols ───────────────────────────────────────────────────
  ["❤️","red heart","love","heart","romance","passion"],
  ["🧡","orange heart","love","warm","support"],
  ["💛","yellow heart","love","happy","friendship","sunshine"],
  ["💚","green heart","love","nature","envy","luck"],
  ["💙","blue heart","love","trust","calm","loyalty"],
  ["💜","purple heart","love","compassion","luxury","royalty"],
  ["🖤","black heart","love","dark","edgy","cool"],
  ["🤍","white heart","pure","love","clean","neutral"],
  ["🤎","brown heart","love","warm","comforting","cozy"],
  ["💔","broken heart","heartbreak","sad","love","loss"],
  ["❤️‍🔥","heart on fire","passion","intense","burning love"],
  ["❤️‍🩹","mending heart","heal","recovery","broken","fixing"],
  ["💕","two hearts","love","couple","affection","romance"],
  ["💞","revolving hearts","love","romance","spinning","couple"],
  ["💓","beating heart","love","heartbeat","alive","pulse"],
  ["💗","growing heart","love","crush","adore","pink"],
  ["💖","sparkling heart","love","glitter","special","excitement"],
  ["💘","heart with arrow","love","cupid","crush","valentines"],
  ["💝","heart with ribbon","love","gift","valentines","bow"],
  ["💟","heart decoration","love","purple","cute"],
  ["💯","hundred points","perfect","100","full marks","score","yes"],
  ["✅","check mark","done","yes","correct","complete","tick"],
  ["❌","cross mark","no","wrong","error","delete","x"],
  ["💢","anger","mad","annoyed","symbol","red"],
  ["💥","collision","boom","explosion","impact","bang"],
  ["💦","sweat droplets","water","wet","splash","drops"],
  ["💨","dashing","wind","fast","blow","air","rush"],
  ["💬","speech bubble","chat","talk","message","comment"],
  ["💭","thought bubble","thinking","dream","thoughts","pondering"],
  ["💤","zzz","sleep","tired","snore","doze"],
  ["🔥","fire","hot","flame","lit","trending","spicy","burn","fire"],
  ["⭐","star","favorite","rating","shiny","gold"],
  ["🌟","glowing star","wow","excellent","special","shine","amazing"],
  ["💫","dizzy star","sparkle","spin","whirl","twinkle"],
  ["✨","sparkles","magic","glitter","shine","sparkling","stars"],
  ["🎉","party popper","celebrate","party","confetti","hooray","congrats"],
  ["🎊","confetti ball","celebrate","party","event","festive"],
  ["🎈","balloon","party","birthday","celebration","float"],
  ["🎂","birthday cake","birthday","cake","celebrate","candles","happy birthday"],
  ["🎁","gift","present","birthday","surprise","wrap","box"],
  ["🏆","trophy","win","award","champion","first place","gold","prize"],
  ["🥇","gold medal","first","winner","champion","best","gold"],

  // ── Animals ────────────────────────────────────────────────────────────
  ["🐶","dog","puppy","pet","animal","cute","doggo","woof"],
  ["🐱","cat","kitten","pet","animal","cute","meow","kitty"],
  ["🐭","mouse","rodent","animal","squeaky"],
  ["🐹","hamster","pet","rodent","cute","fluffy"],
  ["🐰","rabbit","bunny","easter","cute","fluffy","hop"],
  ["🦊","fox","sneaky","clever","cunning","orange","wild"],
  ["🐻","bear","teddy","wild","animal","hugs","cute"],
  ["🐼","panda","china","bamboo","cute","black and white"],
  ["🐨","koala","australia","cute","marsupial","eucalyptus"],
  ["🐯","tiger","wild","stripes","fierce","big cat"],
  ["🦁","lion","king","mane","wild","roar","fierce"],
  ["🐮","cow","moo","farm","milk","spotted"],
  ["🐷","pig","oink","farm","cute","snout","bacon"],
  ["🐸","frog","ribbit","green","lily pad","leap"],
  ["🐵","monkey","ape","primate","cheeky","banana"],
  ["🙈","see no evil","monkey","blind","pretend","shy"],
  ["🙉","hear no evil","monkey","deaf","pretend"],
  ["🙊","speak no evil","monkey","silent","pretend"],
  ["🐔","chicken","farm","bird","cluck","poultry"],
  ["🐧","penguin","cold","arctic","cute","waddle"],
  ["🐦","bird","tweet","feather","fly","tweet"],
  ["🦆","duck","quack","bird","water","waddle"],
  ["🦅","eagle","bird","majestic","fierce","fly","american"],
  ["🦉","owl","wise","night","hoot","bird","knowledge"],
  ["🐺","wolf","wild","howl","pack","moon"],
  ["🐗","boar","wild","pig","forest","tusks"],
  ["🦋","butterfly","rainbow","transform","flight","beautiful","flower"],
  ["🐌","snail","slow","shell","garden","slug"],
  ["🐞","ladybug","insect","red","spots","lucky","bug"],
  ["🐢","turtle","slow","shell","sea","ocean","reptile"],
  ["🐍","snake","slither","venom","hiss","reptile","python"],
  ["🦎","lizard","reptile","gecko","iguana"],
  ["🐙","octopus","sea","tentacles","ocean","squid"],
  ["🦈","shark","ocean","predator","teeth","fin","jaws"],
  ["🐬","dolphin","ocean","smart","flip","play","sea"],
  ["🐳","whale","ocean","big","spout","sea","blue"],
  ["🦭","seal","ocean","arctic","cute","flipper"],
  ["🐈","cat","kitten","pet","meow","kitty","feline"],
  ["🦊","fox","wild","orange","clever","cunning"],
  ["🐕","dog","pet","woof","loyal","animal"],
  ["🦮","guide dog","helper","service","dog","pet"],
  ["🦜","parrot","tropical","talk","colorful","bird"],
  ["🦩","flamingo","pink","tropical","elegant","tall"],
  ["🦚","peacock","colorful","feathers","beautiful","india"],
  ["🦀","crab","sea","shellfish","red","beach","sideways"],
  ["🦞","lobster","seafood","red","ocean","claw"],
  ["🦐","shrimp","seafood","ocean","small","pink"],
  ["🐠","tropical fish","ocean","colorful","reef","fish"],
  ["🐡","blowfish","ocean","round","spiky","fish"],
  ["🐟","fish","ocean","sea","swim","aquatic"],

  // ── Food & drink ───────────────────────────────────────────────────────
  ["🍕","pizza","food","italian","cheese","slice","yum"],
  ["🍔","hamburger","burger","food","fast food","beef"],
  ["🍟","fries","french fries","fast food","potato","salty"],
  ["🌮","taco","mexico","food","tortilla","spicy"],
  ["🌯","burrito","wrap","food","mexico","tortilla"],
  ["🍜","noodles","ramen","food","asian","soup","noodle"],
  ["🍝","spaghetti","pasta","italian","food","noodles"],
  ["🍣","sushi","japanese","food","fish","rice","raw"],
  ["🍱","bento","japanese","food","box","lunch"],
  ["🍙","rice ball","japanese","food","seaweed","onigiri"],
  ["🍦","soft ice cream","ice cream","dessert","sweet","swirl"],
  ["🍧","shaved ice","dessert","sweet","cold","summer"],
  ["🍨","ice cream","dessert","sweet","cold","scoop"],
  ["🍩","doughnut","dessert","donut","sweet","ring","glaze"],
  ["🍪","cookie","dessert","sweet","biscuit","chocolate chip"],
  ["🎂","birthday cake","cake","birthday","celebrate","dessert","candles"],
  ["🍰","shortcake","cake","dessert","sweet","slice"],
  ["🧁","cupcake","dessert","sweet","frosting","birthday"],
  ["🍫","chocolate bar","chocolate","sweet","candy","dessert"],
  ["🍬","candy","sweet","sugar","treat","colorful"],
  ["🍭","lollipop","candy","sweet","swirl","colorful","pop"],
  ["☕","coffee","hot","drink","espresso","latte","cafe"],
  ["🍵","tea","hot","drink","green","calm","herbal"],
  ["🧃","juice box","drink","fruit","kid","straw"],
  ["🥤","cup with straw","drink","soda","juice","smoothie"],
  ["🍺","beer","drink","alcohol","cheers","pub","cold"],
  ["🍻","clinking beers","cheers","beer","drink","toast","party"],
  ["🥂","champagne clinking","toast","celebration","party","fancy"],
  ["🍷","wine","drink","alcohol","red wine","fancy","cheers"],
  ["🍸","cocktail","drink","alcohol","martini","bar","fancy"],
  ["🍹","tropical drink","cocktail","summer","party","holiday"],
  ["🍎","apple","fruit","red","healthy","food"],
  ["🍊","tangerine","orange","fruit","citrus","healthy"],
  ["🍋","lemon","fruit","sour","yellow","citrus"],
  ["🍇","grapes","fruit","purple","vine","wine"],
  ["🍓","strawberry","fruit","red","sweet","summer"],
  ["🫐","blueberry","fruit","blue","healthy","small"],
  ["🍉","watermelon","fruit","summer","green","red","seed"],
  ["🍑","peach","fruit","pink","soft","fuzzy"],
  ["🥭","mango","fruit","tropical","yellow","sweet"],
  ["🍍","pineapple","fruit","tropical","spiky","sweet","yellow"],
  ["🥝","kiwi","fruit","green","tropical","small"],
  ["🥑","avocado","fruit","green","healthy","guac","toast"],
  ["🍆","eggplant","vegetable","purple","food"],
  ["🥦","broccoli","vegetable","green","healthy","food"],
  ["🌽","corn","vegetable","yellow","maize","food"],
  ["🌶️","hot pepper","spicy","chili","hot","red","peppers"],
  ["🍄","mushroom","fungus","mario","forest","food"],

  // ── Travel & places ────────────────────────────────────────────────────
  ["🚀","rocket","space","launch","fast","astronomy","blast"],
  ["✈️","airplane","flight","travel","plane","fly","airport"],
  ["🚂","steam locomotive","train","travel","railway","old"],
  ["🚗","car","drive","vehicle","road","auto","red car"],
  ["🚕","taxi","cab","transport","yellow","ride"],
  ["🚙","suv","car","drive","vehicle","sport"],
  ["🚌","bus","transport","public","travel","school"],
  ["🚎","trolleybus","public transport","electric","bus"],
  ["🚁","helicopter","fly","rotor","air","transport"],
  ["🛸","flying saucer","ufo","alien","space","sci-fi"],
  ["⛵","sailboat","sea","ocean","wind","travel","boat"],
  ["🚢","ship","ocean","cruise","travel","sea"],
  ["🏠","house","home","building","family","residence"],
  ["🏙️","cityscape","city","buildings","urban","skyline"],
  ["🌆","sunset city","evening","city","urban","dusk"],
  ["🏔️","mountain","peak","high","nature","snow","hike"],
  ["🌋","volcano","eruption","lava","fire","nature","hot"],
  ["🏖️","beach","summer","vacation","sand","ocean","sun"],
  ["🌊","wave","ocean","surf","sea","water","tsunami"],
  ["🌍","globe europe africa","world","earth","planet","global"],
  ["🌎","globe americas","world","earth","planet","global","usa"],
  ["🌏","globe asia australia","world","earth","planet","asia"],

  // ── Activities & sports ────────────────────────────────────────────────
  ["⚽","soccer","football","ball","sport","kick","goal"],
  ["🏀","basketball","sport","ball","hoop","nba","orange"],
  ["🏈","football","american football","sport","ball","nfl"],
  ["⚾","baseball","sport","ball","pitcher","bat","mlb"],
  ["🎾","tennis","sport","ball","racket","court","green"],
  ["🏐","volleyball","sport","ball","net","beach"],
  ["🏓","ping pong","table tennis","sport","paddle","ball"],
  ["🥊","boxing glove","fight","sport","punch","boxing"],
  ["🎯","bullseye","target","aim","accurate","darts","goal"],
  ["🎮","video game","gaming","controller","play","gamer"],
  ["🃏","joker","card","wild","game","deck"],
  ["🎲","dice","game","random","chance","roll","lucky"],
  ["🧩","puzzle","piece","jigsaw","challenge","fit","game"],
  ["🎵","musical note","music","song","sound","sing","melody"],
  ["🎶","musical notes","music","song","melody","audio"],
  ["🎸","guitar","music","rock","string","instrument","band"],
  ["🎹","piano","music","keyboard","classical","instrument"],
  ["🎺","trumpet","music","jazz","instrument","brass"],
  ["🎻","violin","music","classical","string","instrument"],
  ["🥁","drum","music","beat","rhythm","percussion","band"],
  ["🎤","microphone","sing","concert","vocal","karaoke","performer"],
  ["🎧","headphones","music","listen","audio","earphones","dj"],
  ["📷","camera","photo","picture","film","snap","photography"],
  ["📱","phone","smartphone","mobile","call","app","device"],
  ["💻","laptop","computer","work","tech","code","pc"],
  ["⌨️","keyboard","type","computer","coding","input"],
  ["🖥️","desktop","computer","monitor","screen","pc"],
  ["🖨️","printer","print","paper","document","office"],
  ["📺","television","tv","screen","watch","show","movie"],
  ["📡","satellite dish","signal","broadcast","communication","space"],

  // ── Objects ────────────────────────────────────────────────────────────
  ["💡","light bulb","idea","bright","electricity","innovation"],
  ["🔋","battery","power","energy","charge","low","electronics"],
  ["🔦","flashlight","light","camping","dark","torch"],
  ["🕯️","candle","light","romantic","dark","flame","wax"],
  ["🔑","key","lock","open","access","home","security"],
  ["🔒","locked","secure","closed","privacy","safety"],
  ["🔓","unlocked","open","access","free","security"],
  ["🔨","hammer","tool","build","construction","hit","nail"],
  ["⚙️","gear","settings","cog","mechanism","technical","tool"],
  ["🔧","wrench","tool","fix","repair","mechanic","maintenance"],
  ["🔩","nut bolt","screw","tool","fix","hardware"],
  ["💊","pill","medicine","drug","health","tablet","prescription"],
  ["💉","syringe","injection","vaccine","medicine","needle","shot"],
  ["🩺","stethoscope","doctor","medical","health","hospital"],
  ["🩻","x-ray","medical","bones","scan","hospital"],
  ["📚","books","read","study","knowledge","library","education"],
  ["📖","open book","read","study","story","page"],
  ["📝","memo","write","note","pencil","list","reminder"],
  ["✏️","pencil","write","draw","sketch","homework"],
  ["🖊️","pen","write","sign","ballpoint","ink"],
  ["📌","pushpin","pin","note","important","mark","location"],
  ["📎","paperclip","attach","clip","document","office"],
  ["📬","mailbox","mail","post","letter","open","receive"],
  ["📦","package","box","delivery","shipping","parcel","mail"],
  ["🎀","ribbon","bow","gift","pink","decoration","pretty"],
  ["💰","money bag","cash","rich","wealth","finance","gold"],
  ["💵","dollar","money","cash","usd","green","usa","bill"],
  ["💳","credit card","pay","bank","shopping","finance"],
  ["⏰","alarm clock","time","wake","morning","schedule","ring"],
  ["⌚","watch","time","wristwatch","clock","hour"],
  ["🗓️","calendar","date","schedule","plan","month","event"],
  ["🌈","rainbow","colorful","pride","beautiful","sky","rain"],
  ["⛅","sun behind cloud","weather","partly cloudy","sky"],
  ["🌙","crescent moon","night","sleep","ramadan","dark","sky"],
  ["☀️","sun","sunny","bright","warm","day","weather","summer"],
  ["❄️","snowflake","winter","cold","frozen","snow","ice"],
  ["🌸","cherry blossom","flower","spring","pink","japan","pretty"],
  ["🌺","hibiscus","flower","tropical","pink","red","bloom"],
  ["🌻","sunflower","flower","yellow","sun","summer","bright"],
  ["🌹","rose","flower","red","love","romance","valentines"],
  ["🌷","tulip","flower","spring","pink","pretty"],
  ["🍀","four leaf clover","luck","lucky","green","ireland","nature"],
  ["🌿","herb","plant","green","nature","leaf","fresh"],
  ["🎋","tanabata tree","bamboo","japanese","wish","star festival"],
  ["🌵","cactus","desert","dry","prickly","plant","southwest"],
  ["🌴","palm tree","tropical","beach","summer","coconut","holiday"],
  ["🍂","fallen leaf","autumn","fall","orange","wind"],
  ["🍃","leaf fluttering","nature","green","wind","fresh"],
  ["🌾","sheaf of rice","grain","farm","harvest","nature","field"],
];

// Build lookup list
const EMOJI_DB: EmojiEntry[] = RAW.map(([emoji, name, ...tags]) => ({ emoji, name, tags }));

// Category definitions (pre-filtered from DB)
const CATEGORIES = [
  { label: "😊 Smileys", range: [0,  79] },
  { label: "👋 Gestures", range: [80, 117] },
  { label: "❤️ Hearts",   range: [118, 151] },
  { label: "🐶 Animals",  range: [152, 214] },
  { label: "🍕 Food",     range: [215, 268] },
  { label: "🌍 Travel",   range: [269, 289] },
  { label: "⚽ Activity", range: [290, 328] },
  { label: "💡 Objects",  range: [329, EMOJI_DB.length] },
];

/* ─── Search helper ──────────────────────────────────────────────────────── */
function searchEmojis(query: string): EmojiEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/\s+/);

  const scored = EMOJI_DB.map(entry => {
    const haystack = [entry.name, ...entry.tags].join(" ").toLowerCase();
    let score = 0;

    for (const token of tokens) {
      if (entry.name.toLowerCase() === token) { score += 10; continue; }
      if (entry.name.toLowerCase().startsWith(token)) { score += 7; continue; }
      if (entry.name.toLowerCase().includes(token)) { score += 5; continue; }
      const tagMatch = entry.tags.some(t => t.toLowerCase().includes(token));
      if (tagMatch) { score += 3; continue; }
      if (haystack.includes(token)) { score += 1; }
    }

    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entry);
}

/* ─── Component ──────────────────────────────────────────────────────────── */
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const results = useMemo(() => searchEmojis(search), [search]);

  const categoryEmojis = useMemo(() => {
    const [start, end] = CATEGORIES[activeTab].range;
    return EMOJI_DB.slice(start, end);
  }, [activeTab]);

  const displayList = search.trim() ? results : categoryEmojis;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center pb-3 px-3"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-3xl overflow-hidden"
        style={{
          background: "rgba(20,20,20,0.82)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          animation: "epSlideUp 0.22s cubic-bezier(0.34,1.2,0.64,1) both",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes epSlideUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .ep-scroll::-webkit-scrollbar { width: 0; }
          .ep-tabs::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/10">
          <Search size={15} className="text-white/40 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/40 hover:text-white/60 text-[12px]">✕</button>
          )}
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="ep-tabs flex overflow-x-auto px-3 pt-3 pb-1.5 gap-1" style={{ scrollbarWidth: "none" }}>
            {[
              "Smileys", "Gestures", "Hearts & Symbols",
              "Food & Nature", "Animals", "Travel",
              "Activities", "Objects",
            ].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  activeTab === i
                    ? "bg-white/15 text-white"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Result hint */}
        {search.trim() && results.length === 0 && (
          <p className="px-4 py-2 text-[12px] text-white/35">
            No results — try "happy", "love", "fire"…
          </p>
        )}

        {/* Emoji grid */}
        <div className="ep-scroll grid grid-cols-8 px-2 py-2 overflow-y-auto" style={{ maxHeight: 232 }}>
          {displayList.map((entry, i) => (
            <button
              key={`${entry.emoji}-${i}`}
              onClick={() => { onSelect(entry.emoji); onClose(); }}
              title={entry.name}
              className="flex items-center justify-center text-[22px] h-10 w-full rounded-xl hover:bg-white/10 active:scale-90 transition-all duration-100"
            >
              {entry.emoji}
            </button>
          ))}
        </div>

        {/* bottom padding for safe area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
