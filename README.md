# BrideHub — Plataforma de Organização de Casamentos

Repositório unificado do projeto **BrideHub**, desenvolvido como TCC do curso de Engenharia de Software da Católica SC.

## Sobre o Projeto

O BrideHub é uma aplicação web **gratuita** para organização de casamentos. A ideia é centralizar em um único lugar tudo que a noiva precisa durante o planejamento — fornecedores, orçamento, tarefas e contratos — sem depender de planilhas complexas ou cerimonialistas.

## Arquitetura e Stack

O projeto adota uma arquitetura limpa e containerizada (Monorepo), estruturada com:

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Prisma ORM
- **Banco de Dados:** PostgreSQL (rodando isolado via Docker)
- **Infraestrutura & Observabilidade:** Docker Compose, Prometheus, Grafana e GitHub Actions

## Estrutura do Repositório

```text
bridehub/
├── frontend/             # Aplicação web em React + Vite
├── backend/              # API REST em Node.js
├── observability/        # Configurações de monitoramento (Prometheus/Grafana)
└── docker-compose.yml    # Orquestração de containers (Banco, API, Web e Monitoramento)
