import { toBatches } from '$lib/batch';
import { dedup } from '$lib/dedup';
import { classifyLemmas } from '../../ai/classifyLemmas';
import { SPANISH } from '../../constants';
import { addWord, getWordByLemma, setWordUnit } from '../../db/words';

const language = SPANISH;
const unit = 5;
const words = dedup(
	//`preferir, amargo, celular, marzo, cerrar, cinco, clima, salchicha, pero, hermoso, feliz, triste, metro, desayuno, carne, ayudar, fuerte, jueves, prestar, jamón, vivir, lentejas, dos, limpiar, otoño, martes, mucho, hora, mantequilla, sándwich, ensalada, ayer, su, allí, puerta, pared, pierna, mirar, azul, té, cuatro, que, poder, tan, auriculares, tomar, para, mundo, siete, verde, lento, año, reír, peso, aprender, preparar, sushi, albóndigas, miércoles, cena, él, dentro, abril, seis, escuchar, escribir, terminar, casa, abrir, sucio, fiesta, empezar, café, hijo, importante, enfrente`
	//	`pasta, minuto, viejo, si, nada, almohada, imagen, retraso, teléfono, arroz, video, jugar, desempleado, malo, pagar, fresco, gustar, mayo, ropa, cabeza, el, negro, nuevo, limpio, hermano, grande, flor, enero, ninguno, refresco, primavera, lentamente, medio, techo, dar, lluvia, españa, colega, cocido, enviar, plato, pan, rápido, nosotros, mañana, sobre, qué, alto, encontrar, septiembre, mujer, abierto, diciembre, silla, queso, bonito, eso, perder, mano, cocina, pimiento, juntos, planta, y, mío, venir, tener, ducharse, nunca, vegetal, trabajar, cerdo, crudo, tiene, cebolla`
	//`olvidar, bebida, vacío, electrónico, lunes, suficiente, vino, hija, cada, mesa, yo, armario, lleno, sonreír, sol, vez, dormir, espejo, dinero, niño, lavar, amigo, panqueque, tarde, segundo, padre, antes, guisado, ir, frijoles, usar, bajo, bicicleta, tres, suave, pregunta, muchos, escuela, sin, taxi, basura, lago, lámpara, res, pastel, piso, poco, mensaje, suelo, taco, responder, ellos, reunión, pantalla, patata, ciudad, cerrado, juego, vosotros, cómo, cerveza, conducir, necesitar, baño, guardar, libro, verano, en, emocionante, julio, vender, llorar, habitación, hacer, acostar`
	//`país, comprar, susurrar, llevar, ventana, seco, noticias, cerca, octubre, televisión, siguiente, amarillo, manta, ahora, hamburguesa, pie, mar, maíz, restante, invierno, alcohol, más, bosque, frito, hombre, nadie, trabajo, red, balcón, montaña, fruta, mes, sopa, viernes, ocho, pequeño, menudo, tomate, aquí, mexico, agua, dulce, todos, película, comida, sentar, feo, llamar, junio, calle, detrás, perro, serie, asado, pez, fin, caliente, semana, cuando, quién, apartamento, noche, mojado, gato, noviembre, ser, llamada, uno, música, efectivo, tampoco, domingo, cansado, tiempo, tibio`
	`hablar, raramente, decir, gente, carta, dormitorio, comer, brócoli, conocer, sal, a, visita, maduro, rojo, después, huevo, alguien, almuerzo, o, jardín, pollo, altavoz, no, cola, tú, querer, leche, día, suyo, sábado, anterior, temprano, divertido, camino, computadora, jugo, volar, ella, con, jefe, bueno, congelado, estar, corto, frío, correr, beber, desde, de, autobús, cama, correo, fuera, helado, siempre, agosto, sofá, coche, febrero, tren, veces, entrenar, móvil, dedo, rico, parque, diez, alguno, zapato, leer, ver, hoy`
		//	`affär, aldrig, alla, alltid, anna, annan, april, arbeta, arbetslös, arm, att, augusti, av, bada, badrum, bakom, balkong, barn, behöva, ben, berg, besök, betala, bil, bild, bitter, bitti, bli, blomkål, blomma, blå, blöt, bo, bok, bord, bra, brev, broccoli, bruka, bröd, bulle, buss, bär, bönor, börja, chef, cykla, dag, dagis, dator, de, december, den, deras, det, dit, dotter, dricka, dryck, du, duscha, där, dålig, dörr, e-post, efter, eftermiddag, eller, en, erik, ett, fattig, februari, fem, fest, fika, film, filt, fin, finger, finnas, fisk, flyg, fläsk, folk, fot, framför, framme, fredag, frukost, frukt, fryst, fräsch, fråga, från, ful, full, fyra, färsk, få, fönster, för, förmiddag, förort, förra, försenad, förälder, gammal, garderob, gata, ge, gilla, glad, glass, glömma, god, godis, golv, grillad, gråta, grön, grönsak, gul, gurka, gå, gång, göra, ha, hamburgare, han, hand, hans, har, hav, helg, heller, hellre, hem, hemma, hennes, hit, hitta, hjälpa, hon, hos, hund, hungrig, hur, hus, huvud, här, högt, högtalare, hörlurar, höst, i, ibland, idag, igår, ikväll, imorgon, inga, ingen, inget, innan, inne, innuti, inte, jag, januari, jobb, jobba, juice, juli, juni, kaffe, kaka, kalas, kall, kassa, katt, kebab, kläder, kokt, kollega, komma, kompis, kort, korv, kristina, kronor, kruka, kudde, kul, kunna, kvar, kvinna, kväll, kyckling, känna, kö, kök, köpa, köra, kött, köttbullar, laga, lamm, lampa, land, lars, le, ledsen, leka, linser, lite, liten, ljummen, lunch, lyssna, lägenhet, lära, läsa, läsk, lågt, låna, långsam, långsamt, lök, lördag, macka, maj, majs, man, mars, mat, matta, med, meddelande, mejla, mella, men, mer, messa, middag, mild, min, minut, mjölk, mobil, mogen, morgon, morot, musik, mycket, mätt, månad, måndag, många, måste, möte, natt, ni, nio, nog, november, nu, ny, nyheter, när, nära, nästa, nät, någon, några, nötkött, och, ofta, oktober, om, omogen, onsdag, ost, padda, pannkaka, paprika, park, pasta, pengar, pizza, potatis, prata, på, regn, ren, rik, ringa, ris, rum, rå, röd, sallad, salt, samtal, se, sekund, sen, september, serie, sex, simma, sin, sitta, sju, sjö, ska, skicka, skinka, sko, skog, skola, skratta, skriva, skräp, skärm, sluta, smuts, smutsig, smör, snabb, snabbt, soffa, sol, sommar, son, soppa, sova, sovrum, spara, spegel, spel, spela, spenat, springa, sprit, spännande, stad, stark, stekt, stol, stor, städa, stänga, stängd, stängt, stå, sur, sushi, svara, svart, svenska, syskon, säga, sälja, sällan, säng, så, söndag, söt, ta, tak, tallrik, tappa, taxi, te, telefon, tid, tidig, tidigt, till, tillsammans, timme, tio, tisdag, titta, toalett, tom, tomat, torr, torsdag, tre, trist, trädgård, träna, trött, tunnelbana, tv, tvätta, två, tycka, tyst, tåg, tårta, törstig, under, utan, utanför, ute, vacker, vad, var, vara, vardagsrum, varje, varm, vart, vatten, vecka, vem, vi, vid, video, viktig, vilja, vin, vinter, viska, vitlök, vuxen, väder, väg, vägg, vän, värld, växt, våffla, våning, vår, äcklig, ägg, än, är, ärtor, äta, åka, år, åtta, öl, öppen, öppet, öppna, över`
		.split(', ')
);

console.log(words.length);

let missing: string[] = [];

for (const batch of toBatches(words, 30)) {
	await Promise.all(
		batch.map(async (wordString) => {
			try {
				const word = await getWordByLemma(wordString, language);

				if (word.unit == null || word.unit > unit) {
					await setWordUnit(unit, word.id, language);
				}
			} catch (e) {
				missing.push(wordString);
			}
		})
	);
}

console.log('missing: ' + missing.join(', '));

// for (const batch of toBatches(missing, 30)) {
// 	const types = await classifyLemmas(batch, { language, throwOnInvalid: false });

// 	await Promise.all(
// 		types.map(async (t) => {
// 			if (t.type == 'cognate' || t.type == 'name' || t.type == 'particle' || t.type == undefined) {
// 				await addWord(t.lemma, { language, type: t.type || null, unit });
// 			} else {
// 				console.log(`Skipping ${t.lemma} (${t.type})`);
// 			}
// 		})
// 	);
// }
