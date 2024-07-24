import { toBatches } from '$lib/batch';
import { dedup } from '$lib/dedup';
import { classifyLemmas } from '../../ai/classifyLemmas';
import { SWEDISH } from '../../constants';
import { addWord, getWordByLemma, setWordUnit } from '../../db/words';

const words = dedup(
	// 'jag, du, han, hon, vi, ni, de, det, en, ett, och, är, har, hus, bil, buss, bok, katt, hund, ge, hjälpa, åka, gå, till, från, med, jobb, skola, Erik, Anna, Lars, Kristina, den, ta, köpa, köra, ' +
	// 'telefon, nät, snabb, stor, liten, bra, dålig, långsam, ny, gammal, blå, grön, röd, svart, gul, väder, tid, nyheter, arbeta, läsa, skriva, prata, lyssna, se, titta, spela, leka, äta, sova, ' +
	// 'park, skog, sjö, hav, berg, land, värld, stad, förort, tunnelbana, hem, trädgård, gata, väg, tåg, flyg, taxi, sko, kläder, tvätta, städa, laga, äta, dricka, sova, duscha, bada, simma, springa, gå, cykla, ' +
	// 'glad, ledsen, säga, fråga, svara, skicka, få, hitta, tappa, låna, betala, spara, skratta, gråta, le, viska, prata, tyst, högt, lågt, snabbt, långsamt, mycket, lite, alltid, aldrig, ibland, ofta, sällan, ' +
	// 'mat, pizza, kök, lägenhet, våning, rum, sovrum, vardagsrum, badrum, toalett, balkong, fönster, dörr, tak, golv, vägg, bord, stol, soffa, säng, garderob, spegel, lampa, kudde, filt, matta, kruka, blomma, ' +
	// 'växt, arbetslös, fattig, rik, pengar, kort, meddelande, brev, e-post, samtal, möte, fest, kalas, middag, lunch, frukost, fika, kaffe, te, mjölk, vatten, öl, vin, sprit, juice, läsk, glass, godis, ' +
	// 'kaka, bulle, bröd, smör, ost, skinka, korv, kött, fisk, grönsak, frukt, bär, sallad, soppa, pasta, ris, potatis, köttbullar, pannkaka, våffla, pannkaka, hamburgare, kebab, sushi, full, tom, hungrig, mätt, ' +
	// 'törstig, törstig, kall, varm, ljummen, stark, mild, söt, sur, salt, bitter, färsk, fryst, kokt, stekt, grillad, rå, mogen, omogen, torr, blöt, ren, smutsig, fräsch, äcklig, god, dålig, ' +
	// 'potatis, morot, lök, vitlök, tomat, gurka, paprika, sallad, spenat, broccoli, blomkål, majs, ärtor, bönor, linser, ris, pasta, bröd, mjölk, ost, smör, ägg, kött, fisk, kyckling, fläsk, nötkött, lamm, korv, ' +
	// 'kaffe, te, vatten, läsk, öl, vin, sprit, juice, glass, godis, kaka, bulle, tårta, bröd, smör, ost, skinka, korv, mejla, messa, måndag, tisdag, onsdag, torsdag, fredag, lördag, söndag, januari, februari, mars, ' +
	// 'april, maj, juni, juli, augusti, september, oktober, november, december, vår, sommar, höst, vinter, morgon, förmiddag, middag, eftermiddag, kväll, natt, dag, vecka, månad, år, sekund, minut, timme, dag, ' +
	//'ringa, kronor, försenad, dator, musik, padda, mobil, skärm, hörlurar, högtalare, bild, video, film, serie, bok, tv, spel'
	// 'ha, barn, dagis, vuxen, förälder, på, många, vara, men, varje, i, två, tre, fyra, fem, sex, sju, åtta, nio, tio, på, varje, några, någon, bo, sälja, sin, min, hans, hennes, deras, '
	//'kunna, måste, få, behöva, vilja, känna, glass, tallrik, tycka, om, viktig, spännande, lära, ute, inne, nära, eller, heller, gilla, kul, trist, skräp, smuts, ren, dryck, macka, fika, '
	//`för, att, man, kvinna, glömma, inte, mer, sitta, nog, av, besök, chef, nästa, förra, sen, tidig, tidigt, än, `
	//	`annan, hellre, vad, hur, vart, var, vem, hos, nu, när, svenska, idag, imorgon, igår, här, där, hit, dit, efter, vän, kompis, kollega, `
	//	'bruka, huvud, hand, fot, ben, arm, finger, komma, så, jobba, trött, regn, finnas, kvar, innan, efter, ikväll, bitti, väder, helg, göra, affär, börja, sluta, framme, stänga, öppna, stängt, öppet, öppen, stängd, son, dotter, syskon, träna, '
	// 'ska, stå, kö, kassa, mella, under, över, framför, bakom'
	'alla, inga, ingen, inget, fin, vacker, ful, gång, vid, bli, folk, sol, utanför, innuti, utan, tillsammans, hemma'.split(
		', '
	)
);

console.log(words.length);

let missing: string[] = [];

for (const batch of toBatches(words, 30)) {
	await Promise.all(
		batch.map(async (wordString) => {
			try {
				const word = await getWordByLemma(wordString, SWEDISH);

				await setWordUnit(1, word.id, SWEDISH);
			} catch (e) {
				missing.push(wordString);
			}
		})
	);
}

for (const batch of toBatches(missing, 30)) {
	const types = await classifyLemmas(batch, { language: SWEDISH, throwOnInvalid: false });

	await Promise.all(
		types.map(async (t) => {
			if (t.type == 'cognate' || t.type == 'name' || t.type == 'particle' || t.type == undefined) {
				await addWord(t.lemma, { language: SWEDISH, type: t.type || null, unit: 1 });
			} else {
				console.log(`Skipping ${t.lemma} (${t.type})`);
			}
		})
	);
}
