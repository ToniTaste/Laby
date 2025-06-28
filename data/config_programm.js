//Default-Programm als XML-String definieren:
const defaultProgramXml = `

<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" id="b0_1750435107018" deletable="false" x="20" y="20">
    <statement name="NEXT">
      <block type="maze_turn" id="b1_1750435107018">
        <field name="DIR">LEFT</field>
        <next>
          <block type="maze_move" id="b2_1750435107018">
            <next>
              <block type="maze_move" id="b3_1750435107018">
                <next>
                  <block type="maze_move" id="b4_1750435107018">
                    <next>
                      <block type="maze_move" id="b5_1750435107018">
                        <next>
                          <block type="maze_move" id="b6_1750435107018">
                            <next>
                              <block type="maze_move" id="b7_1750435107018">
                                <next>
                                  <block type="maze_move" id="b8_1750435107018">
                                    <next>
                                      <block type="maze_turn" id="b9_1750435107018">
                                        <field name="DIR">RIGHT</field>
                                        <next>
                                          <block type="maze_move" id="b10_1750435107018"></block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>

`;