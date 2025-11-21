/**
 * Keyboard training lessons and exercises
 * Ported from the original texter.js
 */

export interface Lesson {
  exercises: string[];
}

export const lessons: Lesson[] = [
  {
    // Lesson 1: Basic home row keys (f, j)
    exercises: [
      "fff jjj fff jjj fjfj fjfj jfjf jfjf ff jf fj ffj fj fjffj jf",
      "aa ss dd ff asdf asdf adsf adsf fdsa fdsa fdsa fdsa dfsas sf",
      "jj kk ll öö jklö jklö jklö jklö ölkj ölkj öljk öljk ölklj jk",
      "asdf jklö ölkj fdsa asdf jklö ölkj fdsa fjdk slaö fjdk slaöj",
      "sl kd fj aö as öl kd jf dk sö kd kö sd af fl ls fj kf dk sla",
      "ada ada kaka kaka fasa fasa ödla ödla ada kaka fasa ja ja ja",
      "fasad fasa dafa lök kall löj flaska klass slask flöd sjö öka",
      "flaska kallas klös kalas skal skölja jas sladd dallas sallad",
      "slaska slösa sladda slöja dölja kladda flöda föda dala falla",
      "slöjd född lödd flaska skala lök klass sallad följd dök köld",
      "kladda dök slösa sjö skala fasad skakad dölja adjö adjö adjö",
      "slöjd kall flöda öl föll skala jaffa falla följd ösa köl ask",
      "dölja döda dala dök död kö ökas ökad föda född sladda slöa öl",
      "sallad söka sökad sak ska skall sjö sladda sköld skala skalad",
      "kalla kalas kallad kall kladda klaff klas kö klass köld kafka",
      "skaka skall klaff falk kalk kalka kalkas kladda sjö sa sak öl",
      "kall slö ja ska ask föll dala sladd sak sök söka söla dö löda",
      "falla kallas skala skalad öka ödla skölj skölja skada ska sak",
      "skal skadad skölja köld fasad föll ja jaffa kaj löda kajak ja",
      "kajak kalla kallas kaj klass flaska sjö sjöss kassa kalka sal",
    ]
  },
  {
    // Lesson 2: Adding g, h, v, m, ä
    exercises: [
      "fff ggg fff ggg fgfgfg ggg gfgfgf ag sg dg fg fjg fjg fg klg",
      "jjj hhh jjj hhh jhjhjh hhh hjhjhj gh öh lh kh jhj fh fh hfjh",
      "vvv fff vvv fff vfvfvf vvv fvfvfv fgfv fgfv fgv fgv fdv vfsv",
      "mmm jjj mmm jjj mjmjmj mmm jmjmjm jhjm jhjm mjhjm mjhjm mkjm",
      "äää ööö äää ööö jäjäjä hähähä mämämä äkä älä lölä lölä älölä",
      "glögg glad glass glöm glömma flagga ägg dagg glöda gädda göl",
      "hall hälla hava hög hal hals hälsa häl haha höll hög höga hö",
      "valla vän hava hav döv döva vad kalva halva löv slav vals av",
      "mamma mjöl mjäll massa flamma klämdes mala halm hjälm samma",
      "öl öka ökad ökas ön ösa flög glöda mö öva övas söva döda dök",
      "jag ska kalla jag ska kalka jag ska hälla jag ska lägga jaja",
      "mamma ska öva sallads vm mamma ska öva hälla glass ska mamma",
      "hala gäss ska skaka av hal mask hal haj ska ägas av alla kaj",
      "vagga vagga söva klas mjölka dags massa mjölk ja mm glad mmm",
      "läsk flaska mjölk glögg mmm skala ägg sallad döljd mask ajaj",
      "lamm mask gök möss kalva gäss gädda haj falk säl daggmask ha",
      "hal halka sladda falla aj föll skadad kladda lagas läggas öm",
      "mjäll mössa hjälm valsa vals flagga flög hög höll mamma haga",
      "glada möss halva dag ska jagas sälja säl hälsa alla alla väl",
      "jag ska mala massa mjöl sälja samma dag jag ska sälja mjöl",
    ]
  },
  {
    // Lesson 3: Adding b, c, e
    exercises: [
      "aaa fbfb fbfb fbfb fgfb fgfb fgfvfb fgfvfb fgfbfv vfbfgf bfb",
      "ddd dcdc dcdcdc dc dcdc dede de dede de dede dedc dedc dedce",
      "ddd eee fff ggg ddee ddff ddgg eeff ffgg fgfg fgfg efef cfcf",
      "abcdefg abcdefg abcdefg abcdefg abcdefg abcdefg abcdefg abcd",
      "abcj defk gabl cdeö fgav bcd efgh abcn defj gabk cdel agkdcb",
      "abba agfa ada anfall alfa bada bas baka be blad bädda blabla",
      "dag deg dagg ladda dala dvs egg el eld elda egg jaffa klaffa",
      "fall feg flög flöda föll glada ge fega glöd ägg glögg flagga",
      "abcdefg gfedcba abcdefg gfecdba abcdefg gfedcba abcdefg gfec",
      "kladda glada flagga bada dag fega ge glöd ägg ack fack macka",
      "mamma ska föda baka bädda bada damma lägga vagga söva släcka",
      "jag ska baka smaka de ska leva klas ska flagga sassa ska öva",
      "hej jag ska säga abcd hej abcdefg jag sa abc hej abcdefg hej",
      "hej kalle sa klas ack ack sa kalle de ska jaga säl alla alla",
      "ska de leva ska de dö ska de väckas ska de sövas glada möss",
      "hej adam hej eva hemma hade jag fem smala glada möss fega möss",
      "hel helg halva dag elda flamma anfalla hemkallad hälsa skägg",
      "gala leka dala smeka glas glass bas kassa falla föll flaska",
      "ja jag jagade sa jag glada backa backa hacka fack lacka lack",
      "abc defg ab cd efg abba ladda macka flagga hej hej glada mamma",
    ]
  },
  {
    // Lesson 4: Adding i, n
    exercises: [
      "jhjh jhjh kiki kiki jhjh kiki jhki jhki jhki ikhj ikhj ikhjh",
      "ll ll jmjm jmjm ll jmjm jnjn jnjn k,k, k,k, k,nj k,nj mjmjk,",
      "hijk hijk hijk lmn, lmn, lmn, h, i, j, k, l, m, n, k, n, lk,",
      "hijklmn, hijklmn, hijklmn, hijklmn, hijklmn, hijklmn, hijklm",
      "hkji jm jhij lhj mh jinmh ijmn j mim jlimm jlmkji mjh illmim",
      "hi, hej, höj, haha, halm hala il illa, ila, lilla, i, id, ni",
      "ja, jag, jämn jama hjälm, lamm namn man massa missa flöda an",
      "jag kan, jag kan, jag kan knacka en del, en hel del, kan jag",
      "hijklmn, hijklmn, hijklmn, hijklmn, nmlkjih, nmlkjih, hijkl",
      "ja, jag kan kalla en bil en dag, ej kan ni kalla en bil idag",
      "han ska dansa hela dagen, jag ska väl vila mig, hemma själv",
      "nämna namn kan du, men kan du se vad kan hända dig min vän",
      "en, fem, elva, kan jag idag ganska väl, även abcdefghijklmns",
      "man kanske ska lägga sig innan kl elva, sa niklas mamma en dag",
      "en dag gick vi vilse, men vi följde min lilla näsa hem igen",
      "isabelle la sig på sängen, funderade länge, david el mikael",
      "ska vi hänga med idag, annie ska väl handla en hel del saker",
      "en dag fiskade jag med min vän klas, men han ville bada i sjön",
      "kvinnan hade en vännina, vänninan hade en vän, en annan vän",
      "följ med mig, vi ska ha en skön kväll, sa han, ja med glädje",
    ]
  },
  {
    // Lesson 5: Adding o, p, q, r, s, t, u
    exercises: [
      "ooo ppp qqq rrr sss ttt uuu ooo ppp qqq rrr sss ttt uuu oooo",
      "lolo lolo öpöp öpöp lololo öpöpöp aqaq aqaq löaopq löaopq pq",
      "frfr frfr ftft ftft frftfrft juju juju k,k, k,k, juk,juk,juk",
      "loöp loöp aqfr aqfr ftju ftju jufr jufr frftfg jujhjn fgtjhu",
      "opqrstu, opqrstu, opqrstu, opqrstu, opqrstu, opqrstu, opqrst",
      "opus ort offer osund ojoj oljud pappa piper part plasma post",
      "rot ropa röka ruta ribba rör sist soppa sport sopa surt stor",
      "titta topp tippa total tom test under ur ute utan uselt guru",
      "opqrstu, opqrstu, opqrstu, opqrstu, opqrstu, opqrstu, opqrst",
      "jag har jobbat bra och kan snart skriva allt, eller vad sägs",
      "snart kan jag skriva hela alfabetet, bara fem bokstäver kvar",
      "nu gäller det att träna upp hastigheten också, jobba på heja",
      "titta, nu kan jag skriva ett t, det var enkelt, ett t till",
      "peter piper picked a peck of pickled peppar, p är inte lätt",
      "inte q nej, vad ska man ha q till, aqua som i aqua minerale",
      "mina herrar, är ni rörda, det rörde oss i rörmokarrörelsen",
      "en till på engelska, she sells sea shells on the sea shore",
      "här i alvesta finns det maskiner som transporterar dagligen",
      "att träffa dig var den bästa saken som har hänt mig i livet",
      "januari, februari, mars, april, maj, juni, juli, augusti, mm",
    ]
  },
  {
    // Lesson 6: Adding v, w, x, y, z, å, ä
    exercises: [
      "fvfvfv swsw swsw swsw swsw sxsx sxsx sxsx swsx swsx sxsw swx",
      "jyjy jyjy jhjy jhjy jujy juyj azaz azaz azza azza azza zazaz",
      "öå öå öå öå öä öä öä ö ä å ö ä å å ä ö öäöå öäöå åå ää öäöåö",
      "l.l. l.l. l.l. l.l. åäö. åäö. åäö. sx. sw. fv. jy. az. öl. ö",
      "vwxyz vwxyz vwxyz. åöä. åöä. vwxyzåöä. vwxyzåöä. vwxyzåöä.",
      "vax vård välkommen veva vrak avstyra avundsjuk avi evig vrål",
      "exakt. yxa. vaxa. läxa. lax. sax. flaxa maxim taxi taxa häxa",
      "yt yr yla. byn, hy, syr. syra syror syster syskon sympati ny",
      "zzz zloty azzuro buzz zara zappa ål så då på gå tå få nå må.",
      "vwxyzåäö. vwxyzåäö. vwxyzåäö. vwxyzåäö. vwxyzåäö. vwxyzåäö.",
      "nu kan du skriva alla bokstäver, men du måste träna mycket.",
      "måndag, tisdag, onsdag, torsdag, fredag, lördag, söndag.",
      "röd, gul, blå, vit, grön, lila, rosa, svart, brun, grå.",
      "the quick brown fox jumped over the lazy dog. a till z finns.",
      "detta är en automatisk telefonsvarare, var god och lämna meddelande",
      "exakt när laxen blir klar kan jag inte säga, svarade zara.",
      "taxi, taxi, skrek jag, snön vräkte när, klockan var redan sex.",
      "ett, två, tre, fyra, fem, sex, sju, åtta, nio, tio, elva, tolv.",
      "en häxa hade en yxa, hennes syster gjorde razzia och snodde yxan.",
      "ett nytt hus i en by syns tydligt för befolkningen, eller hur.",
    ]
  },
  {
    // Lesson 7: Full alphabet practice
    exercises: [
      "abcdefghij abcdefghij abcdefghij abcdefghij abcdefghij abcde",
      "klmnopqrst klmnopqrst klmnopqrst klmnopqrst klmnopqrst klmno",
      "uvwxyzåäö. uvwxyzåäö. uvwxyzåäö. uvwxyzåäö. uvwxyzåäö. uvwxy",
      "abcdefghijklmno, abcdefghijklmno, pqrstuvwxyzåäö. pqrstuvwxy",
      "abcdefghijklmnopqrstuvwxyzåäö. abcdefghijklmnopqrstuvwxyzåäö",
      "januari, februari, mars, april, maj, juni, juli, agusti.",
      "maj, juni, juli, augusti, september, oktober, november, december.",
      "abc, def, ghi, jkl, mno, pqr, stu, vwx, yz, åäö.",
      "äpple, blåbär, hallon, jordgubbe, päron, mandarin, apelsin, kiwi.",
      "abcdefghijklmnopqrstuvwxyzåäö. abcdefghijklmnopqrstuvwxyzåäö",
      "den som är redovisningsskyldig ska utan anmaning lämna deklaration",
      "under det senaste decenniet har modern grafisk teknik förändrats.",
      "jag minns honom mycket väl fast att det var länge länge sen.",
      "jag minns när han gick i sin hage rullade sig och visade magen.",
      "abcdefghijklmnopqrstuvwxyzåäö. abcdefghijklmnopqrstuvwxyzåäö.",
      "vi tackar för er förfrågning och lämnar följande kostnadsförslag",
      "om jag fick välja skulle jag åka till italien, till florens.",
      "nu när du kan skriva hela alfabetet kan du skriva vad som helst.",
      "the man who makes no mistakes does not usually make anything.",
      "en sådan varm och vacker sommardag, ner till sjön måste vi.",
    ]
  },
  {
    // Lesson 8: Numbers and special characters
    exercises: [
      "a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö0 a1ö00",
      "s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l9 s2l99",
      "+++ --- +++ --- +-+- +-+- +-+- +1 -1 +1 -1 +9 -9 +2 -2 2+9 1+0",
      "1290 + 1290 + 1029 + 1029 + 9201 + 9201 + 9201 + 1290 + 1209",
      "d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k8 d3k88",
      "f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j7 f4j77",
      "1029 + 3847 + 1029 + 3847 + 10293847 + 10293847 + 10293847",
      "10293847 - 10293847 + 10293847 - 10293847 + 10293847",
      "t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y6 t5y66",
      "t5y6d3k8 a1ö0s2l9 t5y6d3k8 a1ö0s2l9 t5y6d3k8 a1ö0s2l9 t5y6d3",
      "4657 + 4657 - 4657 + 4657 - 4657 + 4657 - 4657 + 4657 - 4657",
      "1029 + 4657 - 1029 + 4657 - 3846 + 1029 - 4657 + 3846 - 3846",
      "10,29 + 29,38 + 38,47 + 46,50 + 50,10 + 10,29 + 29,38",
      "61,29 + 72,38 + 83,47 + 94,56 + 100,0 + 61,29 + 72,38",
      "12345 - 67890 - 12345 - 67890 - 12345 - 67890 - 12345",
      "11.589,45 + 31.342,09 + 45.602,43 + 89.459,32 + 55.298,24",
      "ägg 12,80 bacon 27,50 smör 17,45 ost 43,20 grädde 11,75",
      "till - 0805 1205 1605 2005 från - 0935 1335 1735 2135",
      "18 mars 19 maj 17 juli 21 september 18 november 19 januari",
      "hem 0472-8271 arb 0472-2293 fax 0472-1826 modem 0470-2319",
    ]
  },
  {
    // Lesson 9: Capital letters and punctuation
    exercises: [
      "aA, aA, aA, aA, aA, fF, fF, fF, fF, jJ, jJ, jJ, jJ, öÖ, öÖ.",
      "sS, sS, sS, dD, dD, dD, lL, lL, lL, kK, kK, kK, hH, hH, hH.",
      "Ada, Johan, Sara, David, Lars, Fanny, Henry, Gunnel.",
      "Adolf, Jenny, Sofia, Dagmar, Lilly, Frans, Harald, Gun.",
      "Erik, Ulla, Ronny, Yngve, Torgil, Iris, Olof, Peter.",
      "Edvard, Urban, Rikard, Ylva, Ture, Ingrid, Olivia, Pernilla.",
      "Nils-Olof, Ann-Christin, Lars-Göran, Britt-Marie, Eva-Lotta.",
      "Per-Gustaf, Ulla-Stina, Ann-Marie, Karl-Åke, Sten-Erik.",
      "1989, (89), 7/7, 7/7, 0=0, 0=0, +?+?+?, F1!, F1!, 35 % 35 %",
      "Paul; Magnus; :Östen: :Christina: :Elisabet: :Jan: ;Rolf;",
      "Stockholm, Göteborg, Malmö, Västerås, Uppsala, Jönköping.",
      "England, Japan, Brazilien, Skottland, Irland, Frankrike.",
      "SAAB, Volvo, VAG, Audi, Ford, Mazda, Toyota, Renault.",
      "A - B - C - D - E. abcde ABCDE. (abcde:ABCDE), (a/A,b/B,c/C).",
      "Temperaturer: Rom 27(28), Madrid 34(29), Paris 17(24);",
      "Resultat: IFK Göteborg-Malmö FF 2-2 (1-1), AIK-Öster 2-1 (0-1).",
      "Frågor: När? Hur ofta? Hur många? Varför? Är du säker?",
      "Pingis VM-guld, EM-silver, SM-brons, men DM gick åt skogen.",
      "Lön: 200 kr/tim. - Skatt (45 %) = 110 kr/tim * 20 tim = 2200:- kr.",
      "Aldrig mer! Usch! Vad hemskt! Hur kunde du? Skäms du inte?",
    ]
  },
  {
    // Lesson 10: Long texts
    exercises: [
      "Den första elektroniska datorn tillverkades redan 1946.\nDen kallades ENIAC och omfattade mer än 18 000 rör, sådana\nsom användes i radio- och TV-apparater förr. Som du kan\nföreställa dig var detta en väldigt stor maskin. Den tog\nensam upp nästan en hel byggnad och vägde 30 ton vilket är\nlika mycket som 30 småbilar. ENIAC användes i ungefär 10 år,\nmen trots sin storlek kunde den inte göra mer än vad en vanlig\nfickräknare klarar idag.",
      "Hej BB!\n\nPå semestern hittade jag en hel rad konstiga saker. Här kommer \nen lista över tre av dem...\n\n1. En hög med tomma spaghettiförpackningar - hur många som helst!\n\n2. En kastrull gjord av trä. Den var avlång och kunde säkert \nanvändas till att koka spaghetti i!\n\n3. En tågbiljett mellan Dover och Brighton.\n\nAllt hittade jag i ett gammalt hus med en skylt där det stod - \nSEGare segrar. Vad tror du?\n\nHälsningar Sofia.",
      "Ny biodator klar att ta över människans roll\n--------------------------------------------\nI Rom finns nu en prototyp av en mänsklig dator\nsom kallas för MANDY. Datorn har en biologisk\nprocessor och har egna känslor och sinnen.\n\nDet största problemet för närvarande är att ingen\nkan bestämma MANDYs kön, vilket har gett datorn\npsykiska besvär och dåligt självförtroende.\n\nI Rom är man dock inte orolig. Påven har kallats\nin för att döpa underbarnet och myndigheterna\nhoppas samtidigt på ett officiellt uttalande.",
      "Forskare hittar nytt användningsområde för penicillin\n\nEn forskare i Göteborg, Doc. Danny Duktig, tros under vinter-\nmånaderna ha hittat en oväntad användning för penicillin.\nDanny hade köpt renoveringstabletter till sin utslitna\nbilmotor men förväxlade dem med sina penicillintabletter.\nResultatet blev att hans normalt svårstartade bil tände så\nfort han vred om nyckeln.\n\nUpprepade försök med pencillintabletter visade ett en tablett\nom dagen vid kallt väder gjorde bilen lättstartad. Danny tror\nockså att bensinförbrukning har minskat med ungefär 25 %.",
      "Vad är egentligen en dator?\n\nMed enkla ord är en dator inte mer än en elektrisk anordning\nprecis som din TV eller frys som har utvecklats för att kunna\nutföra speciella uppgifter. Till exempel kan du använda din\ndator som en skrivmaskin för att skriva brev, som en fick-\nräknare för att göra uträkningar, eller som en TV för att visa\nbilder och ritningar.\n\nDu kan också använda den för att lagra telefonnummer, för att\nspela spel, för att göra ritningar eller original för utskrift.\nDatorer kan också användas för att styra produktionslinjer i\nt ex bilfabriker.\n\nPrecis som andra elektriska anordningar kan datorer gå sönder\noch orsaka problem. Var dock skeptisk när du hör att 'det var\ndatorn som gjorde fel...'. Det är nästan alltid så att det är\nett mänskligt fel, som orsakar det där brevet, vilket uppmanar\ndig att omedelbart betala in skulden på 2 245 376 kronor.",
      "Stor matematikundersökning klar igår\n\nSent igår blev omröstningen klar i den mycket omdebatterade\nundersökningen av matematiska kunskaper hos grundskolelever.\n\nSkolöverstyrelsen lämnade följande resultat:\nAv de 93 representanterna var\n      53 allmänt nöjda,\n      37 allmänt missnöjda och\n       5 la ner sina röster.\n\nOrdförande Henry Kanallt sa efteråt: - Det här resultatet är ett\nklart bevis på att vi här i Sverige verkligen kan vår matematik.",
      "Hej mormor!\n\nJag ville bara tala om för dig att jag har lärt mig att koka \nte. Så här gör man...\n\n1. Mät upp vattnet i en kopp och häll vattnet i en kastrull. \nSätt kastrullen på spisen och vänta ett tag.\n\n2. När vattnet kokar kan du lägga i en tepåse i koppen och hälla \ni vattnet. Du måste göra det försiktigt så att du inte bränner \ndig.\n\n3. Vänta 5 minuter och ta ur tepåsen. Om du vill ha mjölk eller \nsocker kan du lägga i det nu. Drick teet innan det blir kallt. \nPappa säger att te är mycket godare än kaffe.\n\nHej på dig från Alexander.\n\nJag glömde att säga att du måste sätta på spisen först och stänga \nav den sedan. Det vet en mormor redan om.",
      "VM 1958 - Grundspel grupp III\n-----------------------------\nSverige - Mexico  3-0\nUngern  - Wales   1-1\nMexico  - Wales   1-1\nSverige - Ungern  2-1\nSverige - Wales   0-0\nUngern  - Mexico  4-0\n\nSverige 3  2  1  0  5 - 1  5\nWales   3  0  3  0  2 - 2  3\n----------------------------\nUngern  3  1  1  1  6 - 3  3\nMexico  3  0  1  2  1 - 8  1",
      "What happens when you press a key?\n\nWhen you press a key, a code number for the key pressed\nis automatically generated. That code number is placed\nin the keyboard buffer which is a kind of waiting room\nfor keyboard code numbers.\n\nYour computer checks at regular intervals -- many times\na second -- to see if any code number is waiting to be\npicked up from the keyboard buffer. If so, the code number\nis instantly moved to the computer's processor and assessed.\nThe key stroke is then usually sent to the monitor so that\nyou see what key you have pressed.\n\nPlease understand that all this happens in a flash. In fact\nyour computer spends most of its time waiting for you to press\na key!",
      "Översättning till engelska av boken.\n\nPris:\n63.000:-.\n\nFörslag till tidsplan:\nv. 18-27    Översättning\nv. 28-31    Korrektur, kvalitetskontroll & kodning\nv. 31       Leverans av kodat manus\nv. ??       Korrekturläsning av 1:a spaltkorrektur\n\nTidsplanen förutsätter omgående besked (senast v 18) samt\nsnabbleverans av 2 kopior på boken. \n\nProjektledare: Peter Hansson\nÖversättning:  Tim Hughes\n\nMed vänliga hälsningar\n\nPeter Hansson\nEBG",
    ]
  }
];
