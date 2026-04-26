package main

import "github.com/coding-hui/examora/internal/bootstrap"

func main() {
	app := bootstrap.NewAPIApp()
	if err := app.Run(); err != nil {
		panic(err)
	}
}
