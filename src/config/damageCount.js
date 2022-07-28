const log = console.log;

export const damageCount = function(note){

  log(note)
  //[{}]
  /*
    {
      actionName: "q",
      from: "yeLan",
      lockedAttr: undefined,   //=>refineAttr
      multiplicationArea: {
        attack: 1115,
        critical: 0.877,
        criticalDamage: 3.276,
        damageBase: [{base: 'life', rate: 1, from: 'yeLan'}],
        damageMultiple: 0.1023,
        defend: 624.172,
        elementCharge: (8) [1.676, 1.21, 1.21, 1.21, 1.21, 1.21, 1.21, 1.21],
        elementMaster: 42,
        elementReactionRate: undefined,
        elementReactionTimes: 0,
        elementReactionType: undefined,
        elementType: (8) [1, 0, 0, 0, 0, 0, 0, 0],
        level: 90,
        life: 34893.8,

        monsterLevel: 90,
        monsterBaseDefend: 500,
        monsterMinusDefend: 0,
        monsterMinusDefendOnly: 0,
        monsterBaseResistance: (8) [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        monsterMinusResistance: (8) [0, 0, 0, 0, 0, 0, 0, 0],
      },
      timing: 16,
      type: "attach/damage",
    }
  */

  note.forEach(sequence => {
    //lockedAttr + multiplicationArea => attr
  });

};

//攻击乘区
//攻击基数, 攻击比例 (胡桃2命雪梅香双重组合/申鹤冰凌加成)
const attackArea = (attr) => {
  let damageBase = 0;
  attr.damageBase.forEach(res => {
    //       attr.attack or attr.life
    damageBase += attr[res.base] * res.rate;
  });
  return damageBase;
};

//双暴乘区
//todo 特殊暴击计算 (如鱼叉对大招暴击, 小鹿6命e暴击)
const criticalArea = (attr) => {
  const criticalFlag = Math.random() > attr.critical;
  return {
    critical: criticalFlag,   //true 暴击
    criticalRate: criticalFlag ? 1 : attr.criticalDamage,//伤害比
  };
};

//增伤乘区
//todo 特殊增伤 (苍古触发被动, 弓藏被动, 雪梅香算e, 等)
const increaseArea = (attr) => {
  const elementType = attr.elementType;
  const elementIndex = elementType.indexOf(1);
  return attr.elementCharge[elementIndex]; //增伤比
};

//怪物防御乘区 输出承伤比率 .5x
//防御承伤率: (100+角色等级)/( (100+角色等级)+(100+敌人等级)x(1-减防比例) )  --减防多个加算
const defendArea = (attr) => {
  const roleLevel = attr.level;
  const monsterLevel = attr.monsterLevel;
  const monsterDefend = attr.monsterBaseDefend;
  //todo monsterMinusDefendOnly ==> 雷神无视防御非线性最后叠加,这里的计算需要提前,暂记
  let defendMinus = attr.monsterMinusDefend + attr.monsterMinusDefendOnly;
  //减防超过100%
  if(defendMinus >= 1){
    defendMinus = 1;
  }
  return (100 + roleLevel) / ((100 + roleLevel) + (100 + monsterLevel) * (1 - defendMinus));
};

//怪物抗性乘区 输出承伤比率 .9x or 1.05x
const resistanceArea = (attr) => {
  const elementType = attr.elementType;
  const monsterResistance = attr.monsterBaseResistance;
  const resistanceMinus = attr.monsterMinusResistance;
  const elementIndex = elementType.indexOf(1);
  const minused = monsterResistance[elementIndex] - Math.abs(resistanceMinus[elementIndex]);
  return minused >= 0 ? (1 - minused) : (1 - minused / 2);
};

//反应乘区 增幅出系数1.5x or 2x 、剧变出伤害
const chargeArea = (attr) => {
  const roleLevel = attr.level;
  const elementMaster = attr.elementMaster;
  const elementReactionTimes = attr.elementReactionTimes; //魔女/莫娜命座的反应乘区, 与精通计算的数字相加
  const rate = attr.elementReactionRate;
  const type = attr.elementReactionType;
  let zengFuMuti = 1;

  //系数计算 https://bbs.nga.cn/read.php?tid=27127678&_fp=2
  //精通加成=类型系数/(1+1400/精通); 类型系数，增幅2.78，剧变16，结晶4.44
  //等级基本剧变参数 -- 4.0比例
  //   (燃烧：)  超导：扩散：感电：碎冰：超载
  //   =(0.5：)：1.0：1.2 ：2.4：3.0 ：4.0
  const levelBase = [34,37,40,43,45,49,53,58,63,68,74,81,89,97,107,118,129,139,150,161,172,183,194,206,217,226,236,
                     246,259,273,285,298,311,324,338,353,368,383,399,415,431,448,467,487,512,537,563,590,618,647,674,
                     701,729,757,797,833,869,906,945,986,1027,1078,1131,1185,1249,1303,1359,1416,1473,1531,1590,1649,
                     1702,1755,1828,1893,1959,2022,2090,2155,2220,2286,2353,2420,2508,2578,2651,2727,2810,2894];
  //按单倍算
  let juBianBaseDamage = levelBase[+roleLevel-1]/4;
  let chargeRate = 1;
  
  const juBianResistance = .1; //怪物剧变反应抗性, 在此拟定
  //剧变反应增幅百分比 + 1
  const juBianIncrease = 16 * elementMaster / (2000 + elementMaster) + 1;

  if(type === '燃烧'){//出伤害
    chargeRate = .5;
  }
  if(type === '感电'){//出伤害
    chargeRate = 2.4;
  }
  if(type === '超载'){//出伤害
    chargeRate = 4;
  }
  if(type === '超导'){//出伤害
    chargeRate = 1;
  }
  if(type === '扩散'){//出伤害
    chargeRate = 1.2;
  }
  const juBianDamage = juBianBaseDamage * chargeRate * juBianIncrease * (1-juBianResistance);
    
  if(type === '蒸发' || type === '融化'){//出系数
    zengFuMuti = rate * ( 2.78/(1+1400/elementMaster) + elementReactionTimes );
  }
  return {zengFuMuti, juBianDamage};
};




