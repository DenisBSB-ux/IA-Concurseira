/* Doutrina de Redes de Computadores: resumo por assunto do edital (DPDF 2026, Informática/Redes), a partir da apostila da plataforma (apostilas/redes-de-computadores-apostila-edital.pdf).
   Carregado só ao abrir o pop-up (ver doutrinaAbrir em js/teoria.js). A seção abre no assunto da questão (chave redes:N, N = item do edital). */
const DOUTRINA_REDES = {
 "redes": {
  "titulo": "Redes de Computadores: resumo por assunto do edital",
  "secs": [
   {
    "titulo": "1 Fundamentos de redes de computadores",
    "lei": [
     "Rede · hosts ligados por um meio de transmissão e regidos por protocolos, com comutação de pacotes (a mensagem é dividida e os pacotes compartilham os enlaces). Sentido da transmissão: simplex (um só sentido), half-duplex (nos dois sentidos, mas alternados) e full-duplex (simultâneo).",
     "Cliente-servidor × P2P · no cliente-servidor os papéis são distintos (o servidor atende o que o cliente solicita); no peer-to-peer todos os nós são iguais e atuam como cliente e servidor. Internet é a rede mundial de redes; Web é um serviço sobre ela (HTTP); intranet é a rede privada que usa as mesmas tecnologias; extranet abre parte dela a parceiros.",
     "Desempenho · largura de banda (capacidade nominal, em bit/s), vazão (taxa efetiva, menor que a banda), latência (atraso), jitter (variação da latência) e perda de pacotes. Mbps mede velocidade; GB mede quantidade de dados.",
     "Modelo OSI (7 camadas, de cima para baixo) · Aplicação, Apresentação (formato, tradução, criptografia), Sessão (abre, mantém e fecha o diálogo; pontos de verificação), Transporte (fim a fim; segmento), Rede (endereço lógico e roteamento; pacote), Enlace (MAC; quadro) e Física (bits).",
     "Modelo TCP/IP (4 camadas) · Aplicação (agrupa as camadas 5 a 7 do OSI), Transporte, Internet (Rede) e Acesso à rede (Enlace e Física). Encapsulamento: dados → segmento → pacote → quadro → bits. Switch opera no enlace (MAC), roteador na rede (IP), hub na física."
    ],
    "peg": "Física não é a camada mais próxima do usuário (é a Aplicação); roteamento é da camada de Rede; o OSI é modelo de referência, não substitui protocolos; \"interpretação semântica\" é da Aplicação e não da Física."
   },
   {
    "titulo": "2 Redes LAN, WAN e WLAN. Topologias e meios de transmissão",
    "lei": [
     "Alcance · PAN (pessoal), LAN (sala, prédio, campus; alta velocidade e baixa latência), MAN (cidade; interliga LANs), WAN (países e continentes; enlaces de operadoras) e WLAN (LAN sem fio, IEEE 802.11).",
     "Topologias · barramento (cabo único compartilhado; o rompimento do cabo principal afeta vários nós), anel (cada nó liga a dois vizinhos), estrela (todos ligados a um ponto central, hub ou switch; falha de um cabo afeta só um nó; gerência centralizada), árvore (estrelas em níveis) e malha (nós ligados entre si, com múltiplos caminhos).",
     "Par trançado (UTP/STP) · conector RJ-45, até 100 m. Categorias: 5e (100 MHz, 1 Gbps), 6 (250 MHz), 6A (500 MHz, 10 Gbps), 7 (600 MHz, blindagem geral e dos pares, conectores metálicos aterrados) e 8 (2000 MHz, curto alcance em datacenter).",
     "T568A × T568B · pinos 1 a 8. T568B: BL, L, BV, A, BA, V, BM, M. T568A: BV, V, BL, A, BA, L, BM, M (B = branco do; L = laranja; V = verde; A = azul; M = marrom). Cabo direto usa o mesmo padrão nas duas pontas; crossover usa A numa ponta e B na outra. Ethernet 10/100 transmite nos pinos 1-2 e recebe nos 3-6.",
     "Fibra óptica · monomodo (núcleo de 8 a 10 μm, um único feixe, longa distância, sem dispersão modal) e multimodo (núcleo de 50 ou 62,5 μm, vários feixes, curta distância). Conectores de fibra: SC, LC, ST, FC. O RJ-45 é de cobre. Cabeamento estruturado padroniza cabos e pontos de rede para facilitar manutenção e expansão (patch panel, rack, patch cord)."
    ],
    "peg": "Multimodo tem núcleo maior que o monomodo; coaxial RG-6 é cabo de TV; o cabeamento estruturado não aumenta a velocidade da internet nem protege contra ataques; 568A começa pelo verde e 568B, pelo laranja."
   },
   {
    "titulo": "3 Ethernet e padrões IEEE 802",
    "lei": [
     "Ethernet (IEEE 802.3) · em meio compartilhado usa CSMA/CD (detecção de colisão, half-duplex); com switch e full-duplex não há colisão. Quadro: preâmbulo, MAC de destino (6 bytes), MAC de origem (6), EtherType (2), dados de 46 a 1500 bytes e FCS (4); tamanho de 64 a 1518 bytes. MAC de 48 bits, com OUI do fabricante; broadcast FF:FF:FF:FF:FF:FF.",
     "Domínios · hub e repetidor formam um único domínio de colisão; cada porta de switch é um domínio de colisão separado; o switch sem VLAN mantém um único domínio de broadcast; roteador e VLAN o dividem.",
     "Padrões · 10BASE-T (10 Mbps), 100BASE-TX (Fast Ethernet, 100 Mbps, 2 pares), 1000BASE-T (Gigabit, 4 pares), 10GBASE-T (cat 6A). Fibra: 1000BASE-SX (850 nm, multimodo, 220 a 550 m) e 1000BASE-LX (1310 nm, multimodo ou monomodo, até 5 km). A Fast Ethernet admite half e full-duplex.",
     "Família IEEE 802 · 802.1Q (VLAN), 802.1D (STP), 802.1w (RSTP), 802.1X (autenticação por porta), 802.3ad (agregação de links), 802.3af/at (PoE), 802.11 (Wi-Fi), 802.15 (Bluetooth e Zigbee) e 802.16 (WiMAX).",
     "Codificação Manchester · há transição no meio de cada bit, o que dá sincronismo. Na convenção das provas, 0 vira 01 e 1 vira 10; 11001101 fica 1010 0101 1010 0110."
    ],
    "peg": "Gigabit também suporta full-duplex; Fast Ethernet é 100 Mbps (dez vezes a Ethernet de 10 Mbps); o switch comum não separa domínios de broadcast sem VLAN."
   },
   {
    "titulo": "4 Protocolos TCP, UDP, IP, ICMP e ARP",
    "lei": [
     "IP · camada de rede, endereçamento lógico e encaminhamento de pacotes, serviço de melhor esforço (não orientado a conexão e não confiável). Cabeçalho IPv4 de 20 bytes (mínimo), com TTL, protocolo (1 ICMP, 6 TCP, 17 UDP) e checksum só do cabeçalho. O IPv6 tem cabeçalho fixo de 40 bytes, sem checksum.",
     "TCP · orientado a conexão, confiável, entrega ordenada. Abertura em três vias (SYN, SYN+ACK, ACK); encerramento com FIN. Controle de fluxo por janela deslizante e controle de congestionamento (slow start, congestion avoidance). Cabeçalho mínimo de 20 bytes. Usado por HTTP, FTP, SMTP, SSH, POP3 e IMAP.",
     "UDP · sem conexão, sem confirmação, sem retransmissão; cabeçalho de 8 bytes (porta de origem, porta de destino, comprimento e soma de verificação, o campo de detecção de erros). Usado em DNS, DHCP, NTP, SNMP, VoIP e streaming.",
     "Portas e socket · 16 bits: conhecidas (0 a 1023), registradas (1024 a 49151) e dinâmicas (49152 a 65535). Socket (endereço de socket) é a combinação de endereço IP e número de porta, que identifica um processo de rede.",
     "ICMP · protocolo da camada de rede que informa erros e testa condições, com tipo e código numérico: echo request/reply (ping), destination unreachable, time exceeded (usado pelo traceroute). ARP · resolve endereço IP em endereço MAC na rede local, com request em broadcast e reply em unicast, e cache ARP; o inverso é o RARP; no IPv6 a função é do NDP."
    ],
    "peg": "UDP não garante entrega nem ordem (isso é do TCP); o TCP é orientado a conexão; HTTP, SMTP, DNS e FTP são da camada de aplicação; IP, ICMP e ARP são de rede (Internet); o IP entrega sem confiabilidade."
   },
   {
    "titulo": "5 Endereçamento IPv4 e IPv6, sub-redes, CIDR e NAT",
    "lei": [
     "IPv4 · 32 bits em quatro octetos. Classes: A (1 a 126, máscara /8), B (128 a 191, /16), C (192 a 223, /24), D (224 a 239, multicast) e E (reservada); 127.0.0.0/8 é loopback. Privados (RFC 1918): 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16; 169.254.0.0/16 é APIPA.",
     "Máscara e CIDR · o prefixo /n indica os bits de rede: /24 = 255.255.255.0; /25 = .128; /26 = .192; /27 = .224; /28 = .240; /29 = .248; /30 = .252. Hosts úteis = 2^n − 2 (n = bits de host). Tamanho do bloco = 256 − valor da máscara no octeto interessante; a rede é o múltiplo do bloco e o broadcast é o último endereço do bloco.",
     "Exemplos · 187.214.177.64/27: bloco de 32, rede .64, broadcast .95. 201.183.167.160/27: broadcast .191. Com máscara 255.255.192.0 o prefixo é /18 (classe B). VLSM: 32.000 hosts pedem /17; 2.000 hosts, /21; 249 hosts, /24. De um /32 IPv6 saem 2^16 = 65.536 prefixos /48.",
     "IPv6 · 128 bits em oito grupos hexadecimais; abreviação com omissão de zeros à esquerda e \"::\" uma única vez. Sem broadcast (unicast, multicast e anycast); NDP no lugar do ARP; link-local FE80::/10, unique local FC00::/7, global 2000::/3, multicast FF00::/8 e loopback ::1. Autoconfiguração por SLAAC (prefixo do roteador + EUI-64) e DHCPv6; sub-rede padrão /64. Transição: dual stack, tunelamento e tradução (NAT64).",
     "NAT · traduz endereços e portas da rede interna para a externa. Estático (1 para 1), dinâmico (pool de IPs públicos) e PAT/NAPT (vários IPs privados compartilham um IP público, distinguidos pelas portas). Retardou o esgotamento do IPv4, mas não é mecanismo de segurança."
    ],
    "peg": "255.255.255.0 reserva 8 bits para hosts (254 hosts); máscara da classe B é 255.255.0.0; 1.1.1.0 e 8.8.8.0 são públicos; IPv6 tem 128 bits e não usa máscara decimal; confira se o \".255\" realmente fecha o bloco calculado."
   },
   {
    "titulo": "6 Serviços e protocolos de rede: DNS, DHCP, NTP, HTTP/HTTPS, SSH e SNMP",
    "lei": [
     "DNS · sistema hierárquico que traduz nomes em endereços IP (porta 53, UDP e TCP). FQDN é o nome completo, com a posição exata na hierarquia. Registros: A (IPv4), AAAA (IPv6), CNAME (apelido), MX (e-mail), NS (servidor de nomes), PTR (IP para nome), SOA e TXT. Servidor recursivo guarda cache pelo TTL; DNSSEC dá autenticidade e integridade. Se o site abre pelo IP e não pelo nome, o problema é de DNS.",
     "DHCP · atribui IP, máscara, gateway e DNS aos clientes a partir de um escopo (IP dinâmico). UDP 67 (servidor) e 68 (cliente). Etapas DORA: Discover, Offer, Request e Acknowledge; concessão (lease), reservas por MAC e relay entre redes; sem DHCP o Windows usa APIPA (169.254.x.x).",
     "NTP · sincroniza relógios por UDP 123, em hierarquia de stratum; essencial para logs, certificados e Kerberos. HTTP/HTTPS · requisição/resposta sem estado; HTTP na porta 80 e HTTPS (HTTP sobre TLS, com certificado) na 443; métodos GET, POST, PUT, PATCH, DELETE, HEAD; status 2xx sucesso, 3xx redirecionamento, 4xx erro do cliente, 5xx erro do servidor.",
     "SSH · acesso remoto e administração criptografados, TCP 22, com senha ou chave pública; também túneis e SCP/SFTP; substitui o Telnet (porta 23, texto claro). RDP usa a porta 3389.",
     "SNMP · gerência de dispositivos: gerente, agente e MIB (objetos identificados por OID). Operações GET, GETNEXT, GETBULK, SET, TRAP e INFORM; UDP 161 (consultas) e 162 (traps). v1 e v2c usam community string em texto claro; v3 traz autenticação e criptografia. MIB-II tem os grupos system, interfaces, ip, icmp, tcp, udp e transmission; RMON estende a monitoração. Áreas de gerência: falhas, configuração, contabilização, desempenho e segurança.",
     "Outros · FTP (TCP 21 de controle e 20 de dados), SMTP (25; 587 e 465), POP3 (110; baixa o e-mail, sincronização unidirecional), IMAP (143; mantém no servidor e sincroniza os dispositivos), LDAP (389; 636 seguro), Syslog (UDP 514)."
    ],
    "peg": "DHCP distribui IPs, DNS resolve nomes, NAT traduz endereços e proxy intermedia; POP3 não reflete as ações em todos os dispositivos (isso é do IMAP); FTP transfere arquivos, não apaga e-mails; HTTPS é 443 e SSH é 22."
   },
   {
    "titulo": "7 VLAN, trunking e Spanning Tree",
    "lei": [
     "VLAN · divide logicamente o switch em vários domínios de broadcast (segmentação, segurança e menos broadcast). Cada VLAN é uma sub-rede IP; a comunicação entre VLANs exige roteamento (roteador com sub-interfaces ou switch L3). Portas de acesso pertencem a uma VLAN; portas de tronco (trunk) carregam várias. Exige switch gerenciável.",
     "Trunk · IEEE 802.1Q insere uma etiqueta de 4 bytes com VLAN ID de 12 bits (1 a 4094 utilizáveis) e prioridade 802.1p; ISL é o protocolo antigo da Cisco; a VLAN nativa trafega sem etiqueta. Agregação de links (LACP, 802.3ad) junta várias portas em um enlace lógico. Risco: VLAN hopping (double tagging).",
     "STP (IEEE 802.1D) · evita loops de camada 2 (tempestade de broadcast). Os switches trocam BPDUs e elegem a ponte raiz (menor Bridge ID = prioridade, padrão 32768, + MAC). Cada switch escolhe a porta raiz; cada segmento tem uma porta designada; as demais ficam bloqueadas. Estados: blocking, listening, learning, forwarding; convergência de 30 a 50 s.",
     "RSTP (802.1w) converge em segundos; MSTP (802.1s) agrupa VLANs em instâncias; PVST+ é a versão por VLAN da Cisco. Proteções: PortFast, BPDU Guard, Root Guard e Loop Guard."
    ],
    "peg": "VLAN separa domínios de broadcast; o switch comum tem um só domínio de broadcast; STP evita loops (não é protocolo de roteamento); vence a eleição da raiz a menor prioridade/Bridge ID."
   },
   {
    "titulo": "8 Roteamento estático e dinâmico",
    "lei": [
     "Roteador · camada 3, encaminha pacotes entre redes diferentes pela tabela de roteamento, usando a rota de prefixo mais longo; a rota padrão é 0.0.0.0/0 e o gateway padrão é o roteador de saída do host.",
     "Estático × dinâmico · estático é configurado à mão, não se adapta a falhas e não gera tráfego de controle (redes pequenas, rota padrão); dinâmico usa protocolos que aprendem e trocam rotas e se ajusta sozinho a mudanças de carga ou topologia.",
     "IGP × EGP · dentro de um sistema autônomo (AS) usam-se RIP, OSPF, EIGRP e IS-IS; entre ASs usa-se o BGP. RIP: vetor de distância, métrica em saltos (máximo 15), UDP 520. OSPF: estado de enlace, algoritmo SPF (Dijkstra), áreas (a 0 é o backbone), custo por largura de banda, IP protocolo 89. BGP: vetor de caminho, TCP 179, eBGP e iBGP, com políticas.",
     "Distância administrativa · menor valor é mais confiável: conectada 0, estática 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, iBGP 200. A métrica só compara rotas do mesmo protocolo."
    ],
    "peg": "Anunciar redes e receber rotas de outros sistemas autônomos é BGP; OSPF e RIP são protocolos internos; o BGP não controla QoS; switch L2 não roteia, switch L3 roteia entre VLANs."
   },
   {
    "titulo": "9 Redes privadas virtuais (VPN)",
    "lei": [
     "VPN · túnel sobre rede pública ou compartilhada, com criptografia, autenticação e integridade. Tipos: site-to-site (liga duas redes) e acesso remoto (usuário à rede da organização); VPN de provedor (MPLS) isola o tráfego, mas não é obrigatoriamente criptografada.",
     "IPsec · camada de rede; AH (protocolo 51) autentica e garante integridade, sem criptografia; ESP (protocolo 50) criptografa. Modo transporte protege só o payload; modo túnel encapsula o pacote inteiro (usado entre sites). IKE negocia as associações de segurança (UDP 500; NAT-T em UDP 4500).",
     "Outras · SSL/TLS VPN (443, via navegador ou cliente leve), L2TP/IPsec (UDP 1701), PPTP (obsoleto e inseguro), GRE (encapsulamento sem criptografia, protocolo 47), OpenVPN e WireGuard. Split tunneling envia pela VPN só o tráfego da rede corporativa."
    ],
    "peg": "A VPN protege o tráfego em trânsito, mas não substitui firewall, segmentação e controle de acesso internos; AH não criptografa, ESP criptografa; botnet é rede de dispositivos infectados, não VPN."
   },
   {
    "titulo": "10 Equipamentos de rede: switches, roteadores, pontos de acesso e balanceadores de carga",
    "lei": [
     "Por camada · repetidor e hub (física; hub retransmite para todas as portas e forma um único domínio de colisão); bridge e switch L2 (enlace; filtram por MAC); switch L3 e roteador (rede; roteiam por IP); modem (adapta o sinal ao meio do provedor); gateway (liga redes com protocolos diferentes; \"gateway padrão\" é o roteador de saída); ponto de acesso (conecta o sem fio à rede cabeada).",
     "Switch · aprende o MAC de origem, monta a tabela MAC e encaminha o quadro só à porta de destino; desconhecido ou broadcast vai a todas as portas do domínio. Cada porta é um domínio de colisão. Store-and-forward confere o FCS; cut-through encaminha logo após ler o destino. Switch gerenciável oferece VLAN, STP, PoE, QoS e SNMP.",
     "Roteador · interliga LANs e WANs, mantém a tabela de roteamento, faz NAT e pode distribuir IPs (DHCP). O ponto de acesso não roteia entre sub-redes; controladoras WLAN centralizam vários APs.",
     "Balanceador de carga · distribui as requisições entre servidores de um pool, a partir de um IP virtual (VIP). Camada 4 decide por IP e porta; camada 7 decide pelo conteúdo (URL, cabeçalhos, cookies) e pode fazer offload de TLS. Algoritmos: round robin, ponderado, least connections, IP hash. Health checks retiram servidores com falha (failover); persistência mantém o cliente no mesmo servidor.",
     "Proxy · intermediário que filtra, controla o acesso e guarda cache (geralmente compartilhado entre os usuários); o proxy reverso fica do lado do servidor, oculta o back-end e pode balancear e terminar TLS. IDS detecta; IPS detecta e bloqueia; NGFW controla por aplicação e identidade."
    ],
    "peg": "Modem não gerencia IPs nem rotas; switch L2 não roteia; hub não identifica IP; \"estende o alcance\" é repetidor, \"liga segmentos e filtra por MAC\" é bridge, \"melhor caminho entre redes\" é roteador."
   },
   {
    "titulo": "11 Redes sem fio: conceitos, padrões, configuração e segurança",
    "lei": [
     "Padrões IEEE 802.11 · b (2,4 GHz, 11 Mbps), a (5 GHz, 54 Mbps), g (2,4 GHz, 54 Mbps), n (Wi-Fi 4; 2,4 e 5 GHz; MIMO), ac (Wi-Fi 5; 5 GHz; MU-MIMO e beamforming) e ax (Wi-Fi 6; 2,4 e 5 GHz, 6 GHz no 6E; OFDMA, MU-MIMO nos dois sentidos, 1024-QAM, até 9,6 Gbps). Roteadores dual band operam em 2,4 GHz e 5 GHz.",
     "Conceitos · modo infraestrutura (BSS com um AP; ESS com vários APs e roaming), SSID (nome da rede), BSSID (MAC do AP) e modo ad hoc. Acesso ao meio por CSMA/CA, com ACK e RTS/CTS opcional (nó oculto). Em 2,4 GHz os canais 1, 6 e 11 não se sobrepõem; 2,4 GHz tem maior alcance e mais interferência; 5 GHz tem mais canais e velocidade, e menor alcance. Beamforming direciona o sinal, concentrando a energia em um feixe estreito.",
     "Segurança · WEP (RC4, quebrável em minutos, obsoleto), WPA (TKIP), WPA2 (AES-CCMP; PSK ou 802.1X/EAP com RADIUS) e WPA3 (SAE no lugar do PSK, proteção de quadros de gerência, modo Enterprise de 192 bits). WPS é vulnerável; ocultar o SSID e filtrar MAC são medidas fracas; rogue AP e evil twin são ameaças.",
     "Configuração · definir SSID, banda, canal (evitando sobreposição), largura do canal, potência, segurança e VLAN; ativar DHCP e DNS. Em dois roteadores em cascata, o segundo deve ter IP livre na faixa do primeiro e gateway igual ao IP do roteador ligado à internet. Site survey mapeia cobertura e interferência. Bluetooth (802.15.1) é de curto alcance e opera em 2,4 GHz; não é exclusivo de smartphones."
    ],
    "peg": "WEP é o mais fraco, não o mais robusto; WPA2 usa AES-CCMP e o WPA3 introduziu o SAE; Wi-Fi 6 é 802.11ax e 802.11ac é Wi-Fi 5; o ícone de rede sem fio são os arcos de sinal."
   },
   {
    "titulo": "12 Redundância, alta disponibilidade, qualidade de serviço (QoS) e diagnóstico de redes",
    "lei": [
     "Alta disponibilidade · elimina pontos únicos de falha com links, equipamentos e energia redundantes. Disponibilidade: 99,9% ≈ 8 h 46 min de parada por ano; 99,99% ≈ 52 min; 99,999% ≈ 5 min. Disponibilidade ≈ MTBF ÷ (MTBF + MTTR). Datacenter em Tiers: I básico, II com componentes redundantes, III com manutenção sem paradas e IV tolerante a falhas.",
     "Técnicas · STP/RSTP e agregação de links (LACP) na camada 2; gateway redundante com IP virtual: HSRP (Cisco, ativo/standby), VRRP (padrão aberto, mestre/backup) e GLBP (Cisco, também balanceia). Para disponibilidade contínua, a técnica mais eficaz é balanceamento de carga com failover.",
     "QoS · tratamento diferenciado do tráfego sob congestionamento, controlando banda, atraso, jitter e perda (essencial para voz e vídeo). Marcação por DSCP (6 bits, DiffServ), IP Precedence e CoS 802.1p; modelos best effort, IntServ (reserva por fluxo, RSVP) e DiffServ (classes por salto: EF para voz, AF, BE); filas (WFQ, CBWFQ, LLQ); policing descarta o excesso e shaping o suaviza. Mídia em tempo real: RTP (sobre UDP) e RTCP; sinalização SIP e H.323.",
     "Diagnóstico · isolar a camada, de baixo para cima. ping (ICMP echo), traceroute/tracert (TTL), ipconfig /all, /release, /renew e /flushdns (Windows), nslookup/dig (DNS), arp -a, netstat/ss (conexões e portas), route print, nmap, Wireshark/tcpdump (captura), iperf (vazão). Monitoração com SNMP, NetFlow e Syslog (Zabbix, Nagios, Cacti, MRTG, PRTG). Problemas comuns: duplex mismatch, IP duplicado, gateway errado, falha de DNS ou DHCP (169.254.x.x), loop de camada 2."
    ],
    "peg": "Para disponibilidade, a resposta é balanceamento + failover (não IDS, controle de acesso nem testes de penetração); testes de conectividade ajudam a localizar falhas; DiffServ trata classes e IntServ reserva por fluxo."
   }
  ],
  "fontes": [
   [
    "Redes de Computadores — apostila por assuntos do edital (material da plataforma)",
    "apostilas/redes-de-computadores-apostila-edital.pdf"
   ],
   [
    "RFC 791 · Internet Protocol (conferir)",
    "https://www.rfc-editor.org/rfc/rfc791"
   ],
   [
    "RFC 9293 · TCP (conferir)",
    "https://www.rfc-editor.org/rfc/rfc9293"
   ],
   [
    "RFC 768 · UDP (conferir)",
    "https://www.rfc-editor.org/rfc/rfc768"
   ],
   [
    "RFC 1918 · endereços privados (conferir)",
    "https://www.rfc-editor.org/rfc/rfc1918"
   ],
   [
    "RFC 8200 · IPv6 (conferir)",
    "https://www.rfc-editor.org/rfc/rfc8200"
   ],
   [
    "RFC 1034 · DNS (conferir)",
    "https://www.rfc-editor.org/rfc/rfc1034"
   ],
   [
    "RFC 2131 · DHCP (conferir)",
    "https://www.rfc-editor.org/rfc/rfc2131"
   ],
   [
    "RFC 2328 · OSPF (conferir)",
    "https://www.rfc-editor.org/rfc/rfc2328"
   ],
   [
    "RFC 4271 · BGP (conferir)",
    "https://www.rfc-editor.org/rfc/rfc4271"
   ],
   [
    "RFC 4301 · arquitetura IPsec (conferir)",
    "https://www.rfc-editor.org/rfc/rfc4301"
   ],
   [
    "IEEE 802 · padrões (conferir)",
    "https://www.ieee802.org/"
   ]
  ]
 }
};
