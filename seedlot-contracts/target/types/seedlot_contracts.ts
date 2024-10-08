/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/seedlot_contracts.json`.
 */
export type SeedlotContracts = {
  "address": "2zfu7HKSjPFJpi8Ga5EUdPXEQDoR3RV25xUuyFViqx5R",
  "metadata": {
    "name": "seedlotContracts",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addOffer",
      "discriminator": [
        139,
        28,
        26,
        53,
        223,
        138,
        219,
        252
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              }
            ]
          }
        },
        {
          "name": "offersAccount",
          "writable": true
        },
        {
          "name": "orderMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "offerMintMetadata",
          "type": {
            "defined": {
              "name": "mintMetadata"
            }
          }
        }
      ]
    },
    {
      "name": "certify",
      "discriminator": [
        242,
        131,
        34,
        239,
        225,
        117,
        92,
        27
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "manager"
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              }
            ]
          }
        },
        {
          "name": "certificationMint",
          "writable": true
        },
        {
          "name": "managerTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "certificationMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newTier",
          "type": {
            "defined": {
              "name": "certificationTier"
            }
          }
        }
      ]
    },
    {
      "name": "confirmLots",
      "discriminator": [
        44,
        20,
        135,
        91,
        149,
        153,
        23,
        30
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "contract"
          ]
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.admin",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "manager"
        },
        {
          "name": "certificationMint",
          "writable": true,
          "relations": [
            "contract"
          ]
        },
        {
          "name": "managerCertificationTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "certificationMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "usdcMint",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "contractUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "account",
                "path": "tokenProgramStandard"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "managerUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgramStandard"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgramStandard",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "lotsAccount",
          "writable": true,
          "relations": [
            "contract"
          ]
        },
        {
          "name": "lotMint",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "user"
        },
        {
          "name": "userLotTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "lotMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "offersAccount",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "orderMint",
          "writable": true
        },
        {
          "name": "userOrderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "orderMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        }
      ],
      "args": [
        {
          "name": "confirmed",
          "type": "bool"
        },
        {
          "name": "orderIndex",
          "type": "u64"
        },
        {
          "name": "lotIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "decertify",
      "discriminator": [
        111,
        42,
        135,
        127,
        169,
        140,
        197,
        171
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "manager"
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              }
            ]
          }
        },
        {
          "name": "certificationMint",
          "writable": true
        },
        {
          "name": "managerTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "certificationMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              }
            ]
          }
        },
        {
          "name": "certificationMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "offersAccount",
          "writable": true
        },
        {
          "name": "lotsAccount",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "contractUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "account",
                "path": "tokenProgramStandard"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgramStandard",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "treesPerLot",
          "type": "u64"
        },
        {
          "name": "certificationMintMetadata",
          "type": {
            "defined": {
              "name": "mintMetadata"
            }
          }
        }
      ]
    },
    {
      "name": "placeOrder",
      "discriminator": [
        51,
        194,
        155,
        175,
        109,
        130,
        96,
        106
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.admin",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "offersAccount",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "offerMint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "offerMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "usdcMint",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "usdcFrom",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "contractUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgramStandard",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "offerIndex",
          "type": "u64"
        },
        {
          "name": "orderQuantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "prepareLots",
      "discriminator": [
        33,
        147,
        76,
        48,
        60,
        149,
        147,
        24
      ],
      "accounts": [
        {
          "name": "user"
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.admin",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "certificationMint",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "managerCertificationTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "certificationMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "offersAccount",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "lotsAccount",
          "writable": true,
          "relations": [
            "contract"
          ]
        },
        {
          "name": "orderMint",
          "writable": true
        },
        {
          "name": "userOrderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "orderMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lotMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "userLotTokenAccount",
          "writable": true
        },
        {
          "name": "usdcMint",
          "relations": [
            "contract"
          ]
        },
        {
          "name": "contractUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "account",
                "path": "tokenProgramStandard"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "managerUsdcTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "account",
                "path": "tokenProgramStandard"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "tokenProgramStandard",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "orderIndex",
          "type": "u64"
        },
        {
          "name": "orderQuantity",
          "type": "u64"
        },
        {
          "name": "managerForLot",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "contract",
      "discriminator": [
        172,
        138,
        115,
        242,
        121,
        67,
        183,
        26
      ]
    },
    {
      "name": "lots",
      "discriminator": [
        76,
        173,
        126,
        180,
        113,
        59,
        41,
        182
      ]
    },
    {
      "name": "offers",
      "discriminator": [
        160,
        63,
        162,
        20,
        115,
        192,
        237,
        89
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "adminCannotBeCertified"
    },
    {
      "code": 6001,
      "name": "certificationsMustIncreaseByOneTier"
    },
    {
      "code": 6002,
      "name": "cannotCertifyAboveTierFour"
    },
    {
      "code": 6003,
      "name": "noCertificationTierZero"
    },
    {
      "code": 6004,
      "name": "managerAlreadyDecertified"
    },
    {
      "code": 6005,
      "name": "offersFull"
    },
    {
      "code": 6006,
      "name": "invalidOfferIndex"
    },
    {
      "code": 6007,
      "name": "orderMintNotFound"
    },
    {
      "code": 6008,
      "name": "additionalMetadataIllFormed"
    },
    {
      "code": 6009,
      "name": "invalidPrice"
    },
    {
      "code": 6010,
      "name": "lotsFull"
    },
    {
      "code": 6011,
      "name": "managerNotCertified"
    },
    {
      "code": 6012,
      "name": "invalidLotIndex"
    },
    {
      "code": 6013,
      "name": "lotMintMismatch"
    }
  ],
  "types": [
    {
      "name": "certificationTier",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "undefined"
          },
          {
            "name": "tier1"
          },
          {
            "name": "tier2"
          },
          {
            "name": "tier3"
          },
          {
            "name": "tier4"
          },
          {
            "name": "decertified"
          }
        ]
      }
    },
    {
      "name": "contract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treesPerLot",
            "type": "u64"
          },
          {
            "name": "certificationMint",
            "type": "pubkey"
          },
          {
            "name": "offersAccount",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "usdcTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "lotsAccount",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "lot",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "originalPricePerTree",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "lots",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tail",
            "type": "u64"
          },
          {
            "name": "lots",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "lot"
                  }
                },
                10000
              ]
            }
          }
        ]
      }
    },
    {
      "name": "mintMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "locationVarietyPrice",
            "type": {
              "option": {
                "array": [
                  "string",
                  3
                ]
              }
            }
          },
          {
            "name": "managerForLot",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "offer",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "offers",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tail",
            "type": "u64"
          },
          {
            "name": "offers",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "offer"
                  }
                },
                300
              ]
            }
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "totalLots",
      "type": "u64",
      "value": "10000"
    },
    {
      "name": "totalOffers",
      "type": "u64",
      "value": "300"
    }
  ]
};
