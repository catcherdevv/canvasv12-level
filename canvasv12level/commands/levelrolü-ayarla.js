const Discord = require("discord.js");
const config = require('../config.json')
const prefix = config.prefix;
const SQlite = require("better-sqlite3");
const sql = new SQlite('./mainDB.sqlite');
const client = new Discord.Client();

module.exports = {
    name: 'role-level',
    aliases: ['rlevel', 'level-roles'],
    description: "Rewards role when user leveled up to a certain level",
    category: "Leveling",
    cooldown: 3,
    async execute(message, args) {
        if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.reply(`I do not have permission to manage roles!`);
        if (!message.member.hasPermission("MANAGE_ROLES") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply(`You do not have permission to use this command!`);


        if (!args.length) {
            let embed = new Discord.MessageEmbed()
                .setTitle(`seviye rolleri kurulumu`)
                .setDescription(`Kullanıcı belirli bir seviyeye yükseldiğinde ödül rolü`)
                .addFields({ name: `${prefix}rlevel-add <level> <@role>`, value: `Belirli bir seviyeye yükseldiklerinde kullanıcıya verilecek bir rol belirler..` })
                .addFields({ name: `${prefix}rlevel-remove <level>`, value: `Belirtilen seviyedeki rol seviyesini kaldırır.` })
                .addFields({ name: `${prefix}rlevel`, value: `Seviyelere ayarlanmış tüm rolleri gösterir.` })
                .setColor("RANDOM");

            return message.channel.send(embed);
        }

        const method = args[0]
        const levelArgs = parseInt(args[1])
        args.shift()
        args.shift()
        const roleName = args.join(' ')

        const role = message.guild.roles.cache.find(r => (r.name === roleName.toString()) || (r.id === roleName.toString().replace(/[^\w\s]/gi, '')));
        client.getRole = sql.prepare("SELECT * FROM roles WHERE guildID = ? AND roleID = ? AND level = ?");
        client.setRole = sql.prepare("INSERT OR REPLACE INTO roles (guildID, roleID, level) VALUES (@guildID, @roleID, @level);");

        if (method === 'add') {
            if (isNaN(levelArgs) && !levelArgs || levelArgs < 1) {
                return message.reply(`Lütfen ayarlanacak bir seviye belirtin.`);
            } else {
                if (!role) {
                    return message.reply(`Ayarlanacak bir rol sağlamadınız!`);
                } else {
                    let Role = client.getRole.get(message.guild.id, role.id, levelArgs)
                    if (!Role) {
                        Role = {
                            guildID: message.guild.id,
                            roleID: role.id,
                            level: levelArgs
                        }
                        client.setRole.run(Role)
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`Rol başarıyla ayarlandı!`)
                            .setDescription(`${role} seviye için ayarlandı ${levelArgs}`)
                            .setColor("RANDOM");
                        return message.channel.send(embed);
                    } else if (Role) {
                        client.deleteLevel = sql.prepare(`DELETE FROM roles WHERE guildID = ? AND roleID = ? AND level = ?`)
                        client.deleteLevel.run(message.guild.id, role.id, levelArgs);
                        client.updateLevel = sql.prepare(`INSERT INTO roles(guildID, roleID, level) VALUES(?,?,?)`)
                        client.updateLevel.run(message.guild.id, role.id, levelArgs)
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`başarıyla belirlenmiş rol!`)
                            .setDescription(`${role}seviye için güncellendi ${levelArgs}`)
                            .setColor("RANDOM");
                        return message.channel.send(embed);
                    }
                }
            }
        }

        if (method === 'show') {
            const allRoles = sql.prepare(`SELECT * FROM roles WHERE guildID = ?`).all(message.guild.id)
            if (!allRoles) {
                return message.reply(`Belirlenmiş rol yok!`)
            } else {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`${message.guild.name} Rol Seviyesi`)
                    .setDescription(`\`${prefix}rol düzeyinde yardım\` daha fazla bilgi için`)
                    .setColor("RANDOM");
                for (const data of allRoles) {
                    let LevelSet = data.level;
                    let RolesSet = data.roleID;
                    embed.addFields({ name: `\u200b`, value: `**Level ${LevelSet}**: <@&${RolesSet}>` });
                }
                return message.channel.send({ embed });
            }
        }

        client.getLevel = sql.prepare(`SELECT * FROM roles WHERE guildID = ? AND level = ?`)
        const levels = client.getLevel.get(message.guild.id, levelArgs)

        if (method === 'remove' || method === 'delete') {
            if (isNaN(levelArgs) && !levelArgs || levelArgs < 1) {
                return message.reply(`Lütfen kaldırılacak bir seviye belirtin.`);
            } else {
                if (!levels) {
                    return message.reply(`Bu geçerli bir seviye değil!`);
                } else {
                    client.deleteLevel = sql.prepare(`DELETE FROM roles WHERE guildID = ? AND level = ?`)
                    client.deleteLevel.run(message.guild.id, levelArgs);
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`Rol başarıyla ayarlandı!`)
                        .setDescription(`Seviye için rol ödülleri ${levelArgs} Kaldırıldı.`)
                        .setColor("RANDOM");
                    return message.channel.send(embed);
                }
            }
        }

    }
}