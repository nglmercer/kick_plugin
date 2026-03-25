import { RuleBuilder,RuleExporter,type TriggerRule } from "trigger_system/node";
import { KICK_EVENTS } from "kick-wss";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";
const rules:TriggerRule[] = []
KICK_EVENTS.forEach(event => {
    const rule = new RuleBuilder()
        .on(event)
        .id(randomUUID())
        .enabled(true)
        .description(`Log when ${event} event is triggered from kick`)
        .do("log", { message: `KICK_EVENT ${event} triggered` })
        .build();
    rules.push(rule);
    saveRules(rule);
});
async function saveRules(rule: TriggerRule) {
    const yaml = RuleExporter.toYaml([rule]);
    console.log(rule);
    writeFile(join(import.meta.dir, rule.on + ".yaml"), yaml);
}
