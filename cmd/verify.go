package cmd

import (
	"context"
	"fmt"
	"strings"

	"github.com/urfave/cli"

	"github.com/arigatomachine/cli/api"
	"github.com/arigatomachine/cli/config"
)

func init() {
	version := cli.Command{
		Name:      "verify",
		ArgsUsage: "<code>",
		Usage:     "Verify the email address for your account",
		Category:  "ACCOUNT",
		Action: Chain(
			EnsureDaemon, EnsureSession, verifyEmailCmd,
		),
	}
	Cmds = append(Cmds, version)
}

func verifyEmailCmd(ctx *cli.Context) error {
	cfg, err := config.LoadConfig()
	if err != nil {
		return err
	}

	client := api.NewClient(cfg)
	c := context.Background()

	args := ctx.Args()
	if len(args) > 1 {
		text := "Too many arguments.\n\n"
		text += usageString(ctx)
		return cli.NewExitError(text, -1)
	}
	if len(args) != 1 {
		text := "Missing verification code.\n\n"
		text += usageString(ctx)
		return cli.NewExitError(text, -1)
	}

	err = client.Users.VerifyEmail(c, args[0])
	if err != nil {
		if strings.Contains(err.Error(), "wrong user state: active") {
			return cli.NewExitError("Email already verified :)", -1)
		}
		return cli.NewExitError("Email verification failed, please try again.", -1)
	}

	fmt.Println("Your account is now verified.")
	return nil
}