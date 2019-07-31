//index.js
//获取应用实例
const app = getApp()

var WxParse = require('../../plugins/wxParse/wxParse.js');  
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
// var curl = 'http://shopdz.pm.comsenz-service.com/';
Page({
  data: {
    navbar:[],
    // tab菜单
    object: [],
    lastX: 0,          //滑动开始x轴位置
    lastY: 0,          //滑动开始y轴位置
    artileList:[],
    goodsInfo:[],//首页商品详情
    currentFlag: 0,
    name:null,
    is_footer:true,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 轮播图
    imgUrls: [
      // '../../img/banner.jpg',
      // '../../img/login.jpg',
      // '../../img/shops2.png',
    ],
    items: [
      { title: '首页', img: '../../img/home.png'},
      { title: '购物车', img: '../../img/shopcar.png'},
      { title: '订单', img: '../../img/menu.png' },
      { title: '拼团', img: '../../img/group.png' },
    ],
    footer_data: {//页面底部信息
      record_number: '京ICP备13042263号-4',
      footer_info: 'ShopDZ INC.'
    },
    commodity:[],
    interval: 3000,
    duration: 500,
    showList: 0,
    num:0,//购物车数量
    page:1,//页码
    gc_name: null,//商品列表类型
    goods_list: null,//商品列表
    is_display:true,
  },
  onLoad: function(options) {
    if (options){
      var fromid = options.fromid;
      wx.setStorageSync('fromid', fromid);
    }
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          wx.login({
            success: res => {
              var nickName = wx.getStorageSync('nickName');
              var avatarUrl = wx.getStorageSync('avatarUrl');
              var code = res.code;
              var fromid = wx.getStorageSync('fromid');
              console.log(fromid);
              wx.request({
                url: curl + 'api.php/Weixin/getLogin',
                header: {
                  'content-type': 'application/x-www-form-urlencoded' // 默认值
                },
                data: { code: code, nickname: nickName, avatarUrl: avatarUrl, fromid: fromid },
                method: 'POST',
                success: function (res) {
                  if (res.data.code == 0) {
                    wx.setStorageSync('key', res.data.data.key);
                    wx.setStorageSync('openid', res.data.data.weixin_openid);
                  }

                },
              })
            }
          })
          this.setData({
            usershow: false,
            is_footer:true,
          })
        } else {
          wx.login({
            success: res => {
              var nickName = wx.getStorageSync('nickName');
              var avatarUrl = wx.getStorageSync('avatarUrl');
              var code = res.code;
              var fromid = wx.getStorageSync('fromid');
              console.log(fromid);
              wx.request({
                url: curl + 'api.php/Weixin/getLogin',
                header: {
                  'content-type': 'application/x-www-form-urlencoded' // 默认值
                },
                data: { code: code, nickname: nickName, avatarUrl: avatarUrl, fromid: fromid },
                method: 'POST',
                success: function (res) {
                  if (res.data.code == 0) {
                    wx.setStorageSync('key', res.data.data.key);
                    wx.setStorageSync('openid', res.data.data.weixin_openid);
                  }

                },
              })
            }
          })
          this.setData({
            usershow: true,
            is_footer: true,
          })
        }
      }
    });
    var that = this;
    that.details();
    that.menu_details();
    that.footer();
    that.goods_num();
    // that.login();
    that.setData({
      currentY:0,
    });
  },

  //滑动移动事件
  handletouchmove: function(event) {
    var currentX = event.touches[0].pageX
    var currentY = event.touches[0].pageY
    var tx = currentX - this.data.lastX
    var ty = currentY - this.data.lastY
    var that = this;
    var text = ""
    //左右方向滑动
    if (Math.abs(tx) > Math.abs(ty)) {
        if (tx < 0)
            text = "向左滑动"
        else if (tx > 0)
          text = "向右滑动"
    }else {
      var currentY = -1
     }
     this.setData({
       currentY: currentY,
      });

    setTimeout(function () {
      that.currentY();
    }, 2000);
   },

  currentY:function(){
    this.setData({
      currentY: 0,
    });
  },

   //滑动开始事件
   handletouchtart: function (event) {
       this.data.lastX = event.touches[0].pageX
       this.data.lastY = event.touches[0].pageY 
    },
   //滑动结束事件
   handletouchend: function (event) {
       this.data.currentGesture = 0;
       this.setData({
           text: "没有滑动",
        });
    },




  // login:function(){
  //   var nickName = wx.getStorageSync('nickName');
  //   var avatarUrl = wx.getStorageSync('avatarUrl');
  //   var code = wx.getStorageSync('code');
  //   var fromid = wx.getStorageSync('fromid');
  //   wx.request({
  //     url: 'https://miniapp.shopdz.cn/api.php/Weixin/getLogin',
  //     header: {
  //       'content-type': 'application/x-www-form-urlencoded' // 默认值
  //     },
  //     data: { code: code, nickname: nickName, avatarUrl: avatarUrl, fromid: fromid},
  //     method: 'POST',
  //     success: function (res) {
  //       console.log(res,12121212122);
  //       if (res.data.code == 0) {
  //         wx.setStorageSync('key', res.data.data.key);
  //         wx.setStorageSync('openid', res.data.data.weixin_openid);
  //       }

  //     },
  //   })
  // },
  onShow:function(){
    var self = this;
    self.onLoad();
    self.setData({
      is_display: true,
      showList: 0,
    });
    // wx.pageScrollTo({
    //   scrollTop: 0
    // })
  },
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  search:function(e){
    var self = this;
    var q = self.data.name;
    var url = '../fenlei_detail/index?type=2&q='+q;
    wx.navigateTo({
      url: url,
    });
  },
  banner:function(e){
    console.log(e);
    var self= this;
    var id = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    if(type == 'goods'){
      var url = '../details/index?id='+id;
      wx.navigateTo({
        url: url,
      });
    } else if (type == 'category'){
      var url = '../fenlei_detail/index?id=' + id;
      wx.navigateTo({
        url: url,
      });
      // self.details_list(id);
      // self.setData({
      //   is_footer:false,
      // })
    }
  },

  // 菜单切换
  _switch: function(e) {
    var that = this;
    that.setData({
      currentFlag: e.currentTarget.dataset.index
    })
    console.log(that.data.object[that.data.currentFlag])
  },
  prevenD:function(){
    return
  },
  // 展示列表
  showList: function() {
    var self = this;
    var showList = self.data.showList;
    // wx.switchTab({
    //   url: '../fenlei/index?type=1',
    // });
    if (showList == 1){
      this.setData({
        showList: 0
      })
    }else{
      this.setData({
        showList: 1
      })
    }
  },
  //跳转页面
  jump:function(e){
    var route = e.currentTarget.dataset.name;
    var url = '';
    if (route == '首页') {
      this.onLoad();
      this.setData({
        is_display:true,
        is_footer:true,
      });
      wx.pageScrollTo({
        scrollTop: 0
      })
    } else if(route == '购物车'){
      //购物车
      url = '../cart/index'; 
      wx.switchTab({
        url: url,
      });
    }else if(route == '订单'){
      //订单
      url = '../order/index'; 
      wx.navigateTo({
        url: url,
      });
    }else if(route == '拼团'){
      //拼团
      wx.showToast({
        title: '小程序用户暂时无法参加拼团',
        icon: 'none',
        duration: 2000
      });
      // url = '../assemble/index'; 
      // wx.navigateTo({
      //   url: url,
      // });
    } else if (route == '个人中心') {
      //个人中心
      url = '../user/index';
      wx.switchTab({
        url: url,
      });
    }
  },
  showCart:function(){
    wx.switchTab({
      url: '../cart/index',
    });
  },
  //返回顶部
  gotobtn:function(){
    wx.pageScrollTo({
      scrollTop: 0
    })
  },
  //购物车数量
  goods_num:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    // if (!key) {
    //   setTimeout(function () {  //使用  setTimeout（）方法设定定时2000毫秒
    //     self.onLoad();//页面刷新
    //   }, 200);
    // }
    wx.request({
      url: curl +'api.php/Basket/goodssum',
      data:{key:key},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method:'POST',
      success:function(res){
        var num = res.data.data.num;
        app.globalData.num = num;
        console.log(num, app.globalData.num);
        if(num){
          self.setData({
            num: app.globalData.num,
          })
          app.globalData.num = num;
          // console.log(app.globalData.num);
        }else{
          self.setData({
            num: 0,
          })
          app.globalData.num = num;
        }
      }
    })
  },
  //获取数据
  details:function(){
    var self = this;
    wx.request({
      url: curl +'api.php/Index/index',
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == '0'){
          var data = res.data.data.special_item_list;
          var div_html = [];
          var arr_goods = [];
          for(var i = 0;i<data.length;i++){

            switch (data[i].item_type){
              case 'adv_nav':
                self.setData({
                  navbar: data[i].item_data,
                })
              break;
              case 'adv_list':
                self.setData({
                  imgUrls: data[i].item_data,
                })
              break;
              case 'adv_html':
                //html解析
                div_html.push(data[i].item_data);
                for (let i = 0; i < div_html.length; i++) {
                  WxParse.wxParse('reply' + i, 'html', div_html[i], self);
                  if (i === div_html.length - 1) {
                    WxParse.wxParseTemArray("replyTemArray", 'reply', div_html.length, self)
                  }
                } 
                
              break;
              case 'goods':
                arr_goods.push(data[i]);
            }
          }
          self.setData({
            commodity: data,
            goodsInfo: arr_goods,
          })
        }
      }
    })
  },
  details_list:function(e){
    var self = this;
    if (!e.currentTarget){
      var gc_id = e;
    }else{
      var gc_id = e.currentTarget.dataset.id;
    }

    var url = '../fenlei_detail/index?id=' + gc_id;
    wx.navigateTo({
      url: url,
    });
    // var page = self.data.page;
    // wx.request({
    //   url: curl +'api.php/Goods/goods_list',
    //   data: {gc_id: gc_id,p:page},
    //   method:'GET',
    //   success:function(res){
    //     if(res.data.code == 0){
    //       var goods_list = res.data.data.goods_list;
    //       if (goods_list.length >0){
    //         if (res.data.data.categorys.desc) {
    //           var gc_name = res.data.data.categorys.desc;
    //         } else {
    //           var gc_name = res.data.data.categorys.gc_name;
    //         }
    //       }else{
    //         var gc_name = '该分类中暂无商品';
    //       }
    //       if (goods_list){
    //         self.setData({
    //           gc_name: gc_name,
    //           goods_list: goods_list,
    //           showList:0,
    //           is_display:false,
    //         });
    //       }
    //     }
    //   }
    // })
  },
  //获取菜单数据
  menu_details: function () {
    var self = this;
    wx.request({
      url: curl + 'api.php/Goods/all_category',
      method: 'GET',
      success: function (res) {
        if (res.data.code == '0') {
          var menu_data = res.data.data.category;
          // console.log(menu_data);
          if(menu_data){
            self.setData({
              object: menu_data,
            })
          }
          // console.log(self.data.object);
        }
      }
    })
  },
  //首页底部
  footer:function(){
    // api.php / index / getSettings
    var self = this;
    wx.request({
      url: curl + 'api.php/index/getSettings',
      method: 'GET',
      success: function (res) {
        if (res.data.code == '0') {
          var footer_data = res.data.data;
          if (footer_data) {
            self.setData({
              'footer_data.record_number': footer_data.record_number,
              'footer_data.footer_info': footer_data.footer_info,
              'footer_data.shop_logo': footer_data.shop_logo,
            })
          }
          // console.log(self.data.object);
        }
      }
    })
  },
  hide_mask: function () {
    var that = this;
    setTimeout(function () {
      that.setData({
        hasUserInfo: true,
        usershow: false,
      })
    }, 200)
  },
  getUserInfo: function (e) {
    var that = this;
    if (e.detail.userInfo) {
      console.log(e.detail.userInfo);
      app.globalData.userInfo = e.detail.userInfo

    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {
            that.setData({
              hasUserInfo: false,
               usershow: true,
            })
            console.log('用户点击了“返回授权”')
          }
        },
        complete: function () {
          that.setData({
            hasUserInfo: false,
            usershow: true,
          })
        }
      })
    }
  },
  // 隐藏列表
  hideList: function() {
    this.setData({
      showList: 2
    })
  },
})