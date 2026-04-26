// main provides the sandbox server entrypoint.
package main

import (
	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/server"
)

func main() {
	cfg := config.Load()
	sandboxServer := server.NewSandboxServer(cfg)
	if err := sandboxServer.Run(); err != nil {
		panic(err)
	}
}
