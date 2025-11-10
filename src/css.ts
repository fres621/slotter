/** Generate CSS file */

import { writeFileSync } from "fs";

// Version should be bumped when a change that alters id->outcome takes place
let header = `
/**
 * @name Slotter
 * @author .fres.
 * @version 1.0.1
 * @description Gamble using slot machine emoji
 * @source https://github.com/fres621/slotter/
*/
`;
let css = header.trim() + "\n.message__5126c {";
const results = 64;
for (let i = 0; i <= 999; i++) {
    let number = i % results;
    let ii = i.toString().padStart(3, "0");
    let url = `https://github.com/fres621/slotter/raw/refs/heads/main/out/result${number}.gif`;
    css += `&[data-list-item-id$="${ii}"] img[aria-label="🎰"]{content:url("${url}?i=${ii}");}`;
}
css += "\n}";

writeFileSync("./discord-slots.theme.css", css);
