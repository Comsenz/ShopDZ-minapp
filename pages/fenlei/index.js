//index.js
//获取应用实例
const app = getApp()

var WxParse = require('../../plugins/wxParse/wxParse.js');  
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({
  data: {
    navbar:[],
    // tab菜单
    object: [],
    artileList:[],
    goodsInfo:[],//首页商品详情
    currentFlag: 0,
    name:null,
    is_paly:true,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 轮播图
    imgUrls: [
      // '../../img/banner.jpg',
      // '../../img/login.jpg',
      // '../../img/shops2.png',
    ],
    footer_data: {//页面底部信息
      record_number: '京ICP备13042263号-4',
      footer_info: 'ShopDZ INC.'
    },
    commodity:[],
    interval: 3000,
    duration: 500,
    showList: 1,
    loadLock: false,
    num:0,//购物车数量
    page:1,//页码
    gc_name: null,//商品列表类型
    goods_list: [],//商品列表
    is_display:true,
  },
  touchStart(e) {
    this.setData({
      "startX": e.changedTouches[0].clientX,
      "startY": e.changedTouches[0].clientY
    });
  },
  touchEnd(e) {
    var startX = this.data.startX;
    var startY = this.data.startY;
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    if (endX - startX > 50 && Math.abs(endY - startY) < 50) {
      this.setData({
        showList: 1
      })
    }
  },
  onLoad: function(options) {
    var that = this;
    that.menu_details();
    that.details();
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          this.setData({
            usershow: false,
          })
        } else {
          this.setData({
            usershow: true,
          })
        }
      }
    });
    // that.footer();
    // that.goods_num();
    // that.login();
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
  onShow: function (options){
    var self = this;
    self.menu_details();
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          self.setData({
            usershow: false,
            // showList: 1,
            // currentFlag:0,
          })
        } else {
          self.setData({
            usershow: true,
            // showList: 1,
            // currentFlag:0,
          })
        }
      }
    });
  },
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  search:function(e){
    var self = this;
    var q = self.data.name;
    var url = '../fenlei_detail/index?type=2&q=' + q;
    wx.navigateTo({
      url: url,
    });
    // wx.request({
    //   url: curl +'api.php/Goods/goods_list?gc_id=&p=1&q='+q,
    //   method:'GET',
    //   success:function(res){
    //     console.log(res.data);
    //     if(res.data.code == 0){
    //       var list = res.data.data.goods_list;
    //       if(list.length <0 || list.length == 0){
    //         var gc_name = '暂无搜索结果';
    //       }else{
    //         var gc_name = '';
    //       }
    //       self.setData({
    //         gc_name: gc_name,
    //         goods_list: list,
    //         showList: 0,
    //         is_display: false,
    //       });
    //     }
    //   }
    // })
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
    this.setData({
      showList: 1
    })
  },
  showCart:function(){
    wx.switchTab({
      url: '../cart/index',
    });
  },
  //返回顶部
  gotobtn:function(){
    this.setData({
      showList: 1
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
    console.log(e);
    // if (!e.currentTarget){
    //   var gc_id = e;
    //   var page = self.data.page;
    //   var goods_list = self.data.goods_list;
    // }else{
    var gc_id = e.currentTarget.dataset.id;
    var url = '../fenlei_detail/index?id=' + gc_id;
    wx.navigateTo({
      url: url,
    });
      // var page = 1;
      // var goods_list = [];
    // }
    // var is_paly = self.data.is_paly;
    // wx.request({
    //   url: curl +'api.php/Goods/goods_list',
    //   data: {gc_id: gc_id,p:page},
    //   method:'GET',
    //   success:function(res){
    //     if(res.data.code == 0){
    //       if (res.data.data.goods_list.length >0){
    //         if (res.data.data.categorys.desc) {
    //           var gc_name = res.data.data.categorys.desc;
    //         } else {
    //           var gc_name = res.data.data.categorys.gc_name;
    //         }
    //         page++;
    //         is_paly = true;
    //         goods_list = goods_list.concat(res.data.data.goods_list);
    //       } else if(self.data.goods_list.length ==0){
    //         var gc_name = res.data.data.categorys.gc_name+'分类中暂无商品';
    //         is_paly = false;
    //       }
    //       if (goods_list){
    //         self.setData({
    //           gc_name: gc_name,
    //           goods_list: goods_list,
    //           loadLock: false,
    //           showList:0,
    //           gc_id: gc_id,
    //           page:page,
    //           is_paly: is_paly,
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
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // var self = this;
    // console.log(111);
    // var gc_id = self.data.gc_id;
    // if (!self.loadLock) {
    //   if (self.data.is_paly) {
    //     self.details_list(gc_id);
    //   }
    //   self.setData({
    //     "loadLock": true
    //   });

    // }
  },
  // 隐藏列表
  hideList: function() {
    this.setData({
      showList: 2
    })
  },
})