/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/seedlot_contracts.json`.
 */
export type SeedlotContracts = {
  "address": "2HTz6TXN6ERPGS3d5ZpYMjjR6bgpyTh1LjaXB543vEmp",
  "metadata": {
    "name": "seedlotContracts",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
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
          "name": "mint"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintAsSigner",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "minTreesPerLot",
          "type": "u64"
        },
        {
          "name": "lotPrice",
          "type": "u64"
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
            "name": "minTreesPerLot",
            "type": "u64"
          },
          {
            "name": "lotPrice",
            "type": "u64"
          },
          {
            "name": "certificationMint",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
