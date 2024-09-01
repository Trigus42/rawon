import { ApplicationCommandOptionType, Message } from "discord.js";
import { Category as SponsorBlockCategory, Constants as SponsorBlockConstants } from "sponsorblock-api"
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

type SponsorBlockSubCmd = "disable" | "enable" | "status";

const slashCategoryChoices = SponsorBlockConstants.ALL_CATEGORIES.map(x => ({ name: x, value: x }));

@Command({
    aliases: ["sb"],
    description: i18n.__("commands.music.sponsorblock.description"),
    name: "sponsorblock",
    slash: {
        options: [
            {
                description: i18n.__mf("commands.music.sponsorblock.slashStateDescription", {
                    state: "enable"
                }),
                name: "enable",
                options: [
                    {
                        choices: slashCategoryChoices,
                        description: i18n.__mf("commands.music.sponsorblock.slashStateCategoryDescription", {
                            state: "enable"
                        }),
                        name: "category",
                        required: true,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__mf("commands.music.sponsorblock.slashStateDescription", {
                    state: "disable"
                }),
                name: "disable",
                options: [
                    {
                        choices: slashCategoryChoices,
                        description: i18n.__("commands.music.sponsorblock.slashStateCategoryDescription", {
                            state: "disable"
                        }),
                        name: "category",
                        required: true,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.sponsorblock.slashStatusDescription", {
                    state: "status"
                }),
                name: "status",
                options: [
                    {
                        choices: slashCategoryChoices,
                        description: i18n.__("commands.music.sponsorblock.slashStatusCategoryDescription"),
                        name: "category",
                        required: false,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: "{prefix}Category"
})
export class SponsorBlockCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message> {
        const mode: Record<string, SponsorBlockSubCmd> = {
            on: "enable",
            off: "disable",
            enable: "enable",
            disable: "disable",
            stats: "status",
            status: "status"
        }
        const subcmd = mode[
            (
                ctx.options?.getSubcommand() ??
                ctx.args[0] as string | undefined
            )?.toLowerCase() as unknown as string
        ] as SponsorBlockSubCmd | undefined;

        const textMessageArgs = ctx.args.slice(subcmd ? 1 : 0)
        const slashCommandArg = [ctx.options?.get("category", false)?.value]
        const categoryStrings = textMessageArgs.length > 0 ? textMessageArgs : slashCommandArg
        const categories = categoryStrings.filter(x => SponsorBlockConstants.ALL_CATEGORIES.includes(x as SponsorBlockCategory)) as SponsorBlockCategory[];
        const invalidCategories = categoryStrings.filter(x => !SponsorBlockConstants.ALL_CATEGORIES.includes(x as SponsorBlockCategory));

        const current = ctx.guild?.queue?.sponsorBlockCategories ?? [];

        if (subcmd === "enable" || subcmd === "disable") {
            if (categories.length === 0 || invalidCategories.length > 0) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            i18n.__mf("commands.music.sponsorblock.specifyCategories")
                        )
                    ]
                });
            }

            if (subcmd === "enable") {
                ctx.guild?.queue?.enableSponsorBlockCategories(categories);
            } else {
                ctx.guild?.queue?.disableSponsorBlockCategories(categories);
            }

            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        i18n.__mf("commands.music.sponsorblock.categorySuccess", {
                            categories: categories.join(", "),
                            state: subcmd
                        })
                    )
                ]
            });
        }

        if (subcmd === "status") {
            const category = ctx.options?.getString("category") as SponsorBlockCategory | undefined;
            const status = category ? current.includes(category) : current.length > 0;

            if (category) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            i18n.__mf("commands.music.sponsorblock.categoryStatus", {
                                category: category,
                                state: status ? "enabled" : "disabled"
                            })
                        )
                    ]
                });
            }

            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        i18n.__mf("commands.music.sponsorblock.categoriesStatus", {
                            categories: current.join(", ")
                        })
                    )
                ]
            });
        }

        return ctx.reply({
            embeds: [
                createEmbed(
                    "warn",
                    i18n.__mf("reusable.invalidUsage", {
                        prefix: `${this.client.config.mainPrefix}help`,
                        name: this.meta.name
                    })
                )
            ]
        });
    }
}
